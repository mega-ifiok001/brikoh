# 02 — Database Schema

All tables are in a Postgres database. `businessId` is the tenant key on every merchant-owned table. UUID primary keys unless noted.

---

## auth & account

### users
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| name | text | |
| email | citext unique | normalized lowercase |
| password_hash | text | argon2id/bcrypt |
| phone | text | |
| role | enum('owner','admin','manager','cashier') | defaults to owner on signup |
| permissions | text[] | denormalized for fast checks (e.g. `['record_sales']`) |
| status | enum('active','suspended') | suspension by platform admin blocks all auth |
| last_login_at | timestamptz | |
| created_at / updated_at | timestamptz | |

### refresh_tokens
| id | uuid pk | |
| user_id | fk users | |
| token_hash | text unique | store hash, never raw |
| expires_at | timestamptz | |
| revoked_at | timestamptz null | |

### password_resets
| id | uuid pk | |
| user_id | fk users | |
| code_hash | text | 6-digit code, hashed |
| email | text | |
| expires_at | timestamptz | 15 min TTL |
| used_at | timestamptz null | |

### businesses
| id | uuid pk | |
| owner_user_id | fk users | |
| name | text | |
| category | text | one of the onboarding categories |
| country | text | |
| city | text | |
| currency | enum('NGN','USD','GHS','KES','ZAR','GBP','EUR') | |
| phone | text | business phone |
| whatsapp | text | drives storefront chat button |
| website_name | text unique null | slug → `<website_name>.brikoh.app` |
| template | enum('classic','modern','bold') | storefront template |
| website_live | bool | true once onboarding completes |
| hero_title / hero_subtitle / tagline / accent | text | Website Studio customization |
| plan | enum('starter','pro','growth') | defaults starter |
| plan_status | enum('trialing','active','past_due','cancelled') | |
| status | enum('active','suspended') | |
| created_at / updated_at | timestamptz | |

---

## inventory

### branches
| id | uuid pk | |
| business_id | fk | |
| name | text | e.g. "Main Store" |
| location | text | |
| is_default | bool | |

### categories / units
| id | uuid pk | |
| business_id | fk | |
| name | text | unique per business |

### products
| id | uuid pk | |
| business_id | fk, idx | |
| name | text | |
| description | text | |
| category | text | denormalized name (or fk) |
| unit | text | |
| cost_price | numeric null | |
| selling_price | numeric | required to publish |
| discount_price | numeric null | |
| threshold | int | low-stock alert level |
| expiry | date null | |
| emoji | text | fallback/cover |
| images | jsonb | ordered array of image URLs; `images[0]` = cover |
| status | enum('draft','active','archived') | archived = soft delete |
| created_at / updated_at | timestamptz | |

Publish validation (enforced by backend too): name, category, unit, selling_price > 0, at least one image.

### product_variants
| id | uuid pk | |
| product_id | fk | |
| name | text | e.g. "Small" |
| price | numeric | override |
| (stock is derived from stock_events where variant_id set) | | |

### stock_events  ← THE stock ledger
| id | uuid pk | |
| business_id | fk, idx | |
| product_id | fk | |
| variant_id | uuid null | |
| branch_id | fk | |
| type | enum('initial','restock','sale','damage','correction','transfer_out','transfer_in') | |
| delta | int | positive = in, negative = out (never 0) |
| note | text | |
| ref | text | e.g. sale id / PO id / withdrawal id |
| user_id | uuid null | who did it |
| created_at | timestamptz | indexed `(business_id, product_id, created_at)` |

**Invariant:** current stock = `SUM(delta)` grouped by `(product_id, variant_id, branch_id)`. Never store a `stock_quantity` column.

### suppliers
| id | uuid pk | | | business_id | fk | |
| name | text | | | phone / email | text | |
| created_at | | | |

### purchase_orders
| id | uuid pk | |
| business_id | fk | |
| supplier_id | fk | |
| branch_id | fk | |
| status | enum('pending','approved','received','cancelled') | |
| total | numeric | computed from lines |
| created_at | timestamptz | |

### purchase_order_items
| po_id | fk | |
| product_id | fk | |
| quantity | int | |
| unit_cost | numeric | |

---

## sales & customers

### sales
| id | uuid pk | |
| business_id | fk, idx | |
| customer_id | uuid null fk | null = walk-in |
| branch_id | fk | |
| items | jsonb | `[{productId,name,qty,price}]` snapshot |
| subtotal | numeric | |
| discount | numeric | |
| total | numeric | |
| method | enum('cash','transfer','card','credit') | |
| paid | numeric | |
| status | enum('paid','owing','partial') | derived-but-stored for query speed; always kept consistent in same transaction |
| channel | enum('POS','STOREFRONT','MANUAL') | where the sale originated |
| created_at | timestamptz | |

### customers
| id | uuid pk | |
| business_id | fk, idx | |
| name | text | |
| phone | text | **the dedupe key** — unique normalized (digits only) per business |
| email | text null | |
| group_ids | uuid[] | a customer can be in many groups |
| source | enum('STOREFRONT','POS','MANUAL','IMPORTED') | |
| status | enum('active','deleted') | soft delete |
| created_at / updated_at | | |

**Invariant:** `total_spent`, `total_orders`, `last_purchase_date`, `owing_balance` are ALWAYS computed from `sales` — never columns.

### customer_groups
| id | uuid pk | |
| business_id | fk | |
| name | text | |
| discount_pct | numeric | auto-applied at sale time when customer is a member |
| created_at | | |

### customer_notes
| id | uuid pk | |
| customer_id | fk | |
| note | text | |
| user_id | uuid null | |
| created_at | | |

### discounts
| id | uuid pk | |
| business_id | fk | |
| name | text | |
| type | enum('percentage','fixed') | |
| value | numeric | |
| applies_to | enum('product','category','group','all') | |
| target | text | product id / category name / group id / "All" |
| start / end | date null | |
| active | bool | |
| created_at | | |

---

## payments, wallet & accounting

### payment_transactions
| id | uuid pk | |
| business_id | fk, idx | |
| sale_id | fk null | reconciliation — must match a sale; orphan flagged |
| paystack_reference | text unique | idempotency key for webhooks |
| amount | numeric | gross |
| paystack_fee | numeric | |
| net_amount | numeric | amount − fee |
| channel | enum('CARD','BANK_TRANSFER','USSD','QR') | from Paystack response |
| status | enum('PENDING','SUCCESS','FAILED','REVERSED') | |
| paid_at | timestamptz null | |
| settled_at | timestamptz null | when funds land (Phase 1) |
| created_at | timestamptz | |

### wallet_ledger  ← THE wallet ledger
| id | uuid pk | |
| business_id | fk, idx | |
| type | enum('SALE_SETTLEMENT','WITHDRAWAL','INTEREST_PAYOUT','FEE','REVERSAL','REFUND') | |
| amount | numeric | signed; positive credit, negative debit |
| reference_id | text | payment id / withdrawal id |
| note | text | |
| settled | bool | Phase 1: pending until Paystack settlement window |
| created_at | timestamptz | |

**Invariant:** wallet balance = `SUM(amount)` of ledger. Never store a balance column.

### bank_accounts
| id | uuid pk | |
| business_id | fk | |
| account_number | text | |
| bank_name | text | |
| bank_code | text | Paystack recipient code |
| account_name | text | resolved via Paystack |
| is_verified | bool | withdrawals require verified |
| is_default | bool | |
| created_at | | |

### withdrawals
| id | uuid pk | |
| business_id | fk | |
| amount | numeric | |
| fee | numeric | flat 50 (NGN) — shown to user before confirm |
| bank_account_id | fk | must be verified |
| status | enum('PENDING','PROCESSING','SUCCESSFUL','FAILED') | |
| paystack_transfer_reference | text null | |
| requested_at / completed_at | timestamptz | |

### expenses
| id | uuid pk | |
| business_id | fk | |
| category | text | |
| amount | numeric | |
| description | text null | |
| date | date | |
| user_id | uuid null | |
| created_at | | |

### expense_categories
| business_id + name unique per business | |

---

## marketing

### campaigns
| id | uuid pk | |
| business_id | fk | |
| name | text | |
| channel | enum('whatsapp','sms','email') | |
| audience | enum('all','vip','group','wholesale') | |
| group_id | uuid null | when audience = group |
| message | text | |
| status | enum('draft','scheduled','sending','sent','failed') | |
| delivered_count / opened_count | int | |
| scheduled_at / sent_at | timestamptz | |

### coupons
| id | uuid pk | |
| business_id | fk | |
| code | text unique per business | uppercase, validated `[A-Z0-9]{3,}` |
| type | enum('percentage','fixed') | |
| value | numeric | |
| expires | date null | |
| max_uses | int | |
| uses | int | |
| active | bool | |

### socials
| business_id pk | |
| instagram / facebook / tiktok / website | text | |

---

## analytics

### ga_connections
| business_id | fk | |
| measurement_id | text | e.g. G-XXXXXXX |
| status | enum('connected','error') | |
| connected_at | | |

KPI reports are computed on the fly (see reports section) — no snapshot table required for v1, but an optional `financial_snapshots` (periodStart, periodEnd, revenue, cogs, expenses, net_profit, generated_at) is recommended for performance.

---

## notifications

### notifications
| id | uuid pk | |
| business_id | fk | |
| user_id | uuid null | null = business-wide |
| type | text | e.g. `LOW_STOCK`, `OUT_OF_STOCK`, `EXPIRING_SOON`, `PENDING_PO`, `SETTLEMENT_PENDING`, `WITHDRAWAL_UPDATE`, `OWING_BALANCE`, `NEW_SALE`, `CAMPAIGN_SENT` |
| title / message | text | |
| ref_id | text | product id / sale id / withdrawal id |
| read_at | timestamptz null | |
| created_at | timestamptz | |

---

## ops / platform

### platform_users
| id | uuid pk | |
| email | citext unique | |
| password_hash | text | |
| role | enum('super_admin','support','finance') | |
| status | enum('active','disabled') | |

### feature_flags
| id | text pk | |
| name / description | text | |
| enabled | bool | |
| group | enum('payments','inventory','marketing','platform') | |
| gated | bool | true ⇒ requires licensing partner before enabling |

### plans
| id | enum('starter','pro','growth') pk | |
| monthly_price | numeric | |
| quarterly_price | numeric | |
| popular | bool | |

### website_templates
| id | enum('classic','modern','bold') pk | |
| enabled | bool | |

### support_tickets
| id | uuid pk | |
| name / email / topic / message | text | from contact form |
| status | enum('new','resolved') | |
| created_at | | |

### audit_logs
| id | uuid pk | |
| business_id | uuid null | null = platform-level |
| user_id | uuid null | |
| action | text | e.g. `record_sale`, `restock`, `payment_received`, `withdrawal_request`, `product_create`, `staff_invite` |
| detail | text | human-readable summary |
| created_at | timestamptz | |

---

## Full-flow transaction example (sale)

```
BEGIN;
  -- 1. Check stock for each line (SELECT SUM(delta) FOR UPDATE on product)
  -- 2. If method = credit: customer owes; else collect payment
  -- 3. INSERT sale (status = paid | owing | partial)
  -- 4. INSERT stock_events (type='sale', delta=-qty) per line
  -- 5. If customerId given: ensure customer exists (by phone) — create if not (source=POS/STOREFRONT)
  -- 6. If payment method is card/transfer: INSERT payment_transactions (via Paystack)
  -- 7. INSERT wallet_ledger (SALE_SETTLEMENT, settled=false) — Phase 1 pending
  -- 8. INSERT audit_log
COMMIT;
```
