# 04 — Business Rules & Flows

This file is the single source of truth for invariants the backend must enforce. Every rule here maps to a screen the frontend already ships.

---

## 1. Stock is a ledger, never a column

- `GET /products/:id/stock-history` drives the "Stock History" timeline with a **running balance**.
- Rules:
  - `restock` = +qty (optional supplier, note)
  - `sale` = −qty per line, `ref` = sale id
  - `damage` = −qty, cannot exceed current stock
  - `correction` = set-to value → delta is computed (`new − current`), can be ±
  - `transfer_out` = −qty on source branch; `transfer_in` = +qty on destination; same txn
  - `initial` = opening stock (product creation, bulk import, PO receive uses `restock`)
- Every mutation appends ≥1 event AND writes an audit log entry, in the same transaction.

## 2. Product publish gating

A product cannot be `active` (published) without:
1. name (≥ 2 chars)
2. category
3. unit
4. selling price > 0
5. at least one image (`images[0]`)

`draft` only requires a name. Backend re-validates on PATCH — the frontend already blocks this in the form, but never trust the client.

## 3. Duplicate product

`POST /products/:id/duplicate`:
- Copies everything except **stock → 0** and **status → draft** (variants are NOT copied per the frontend behavior — new variants array empty).

## 4. Bulk upload rules

- Max **500 rows** / file, ≤ 1MB, `.csv` or `.xlsx`.
- Template headers: `name,category,unit,cost_price,selling_price,starting_stock`.
- Error if: missing name, invalid (≤0) selling price.
- **Duplicate name vs existing product** → flagged in preview; merchant chooses **skip** (default) or **create anyway**. Never silently overwrite.
- On confirm, each valid row creates a product (status active) + an `initial` stock event with `starting_stock`.
- A failed row must NOT abort the whole import — only valid rows import; response reports `{imported, skipped}`.

## 5. Sales

- A sale cannot have a line quantity greater than current stock **unless** the `allow_overselling` feature flag is on.
- Payment methods: `cash | transfer | card | credit`.
  - `credit` → status `owing` (or `partial` if a deposit paid), customer `owingBalance` increases, **no wallet/payment record** until repayment.
  - `cash` → paid immediately.
  - `transfer`/`card` → go through Paystack (see 05-payments.md).
- Every sale creates `sale` stock events. **Atomic with stock check** (row locks) to prevent overselling under concurrency.
- Refunds (Phase 1: via repayment screens / admin) must: create a `REFUND` wallet ledger entry (debit) and **exclude the refunded sale from Profit & Loss** revenue.

## 6. Customers

- **Phone is the dedupe key**: normalized digits, unique per business. `findOrCreateCustomer(name, phone, email, source)`:
  - exists → link sale to it (optionally enrich name/email)
  - missing → create with `source` = STOREFRONT/POS/MANUAL/IMPORTED
- `totalSpent`, `totalOrders`, `lastPurchaseDate`, `owingBalance` are computed from `sales`, never stored.
- A customer can belong to **multiple groups** (`group_ids[]`).
- Deleting a customer = soft delete (sales history preserved).
- Bulk import must never overwrite — duplicates flagged, merchant decides.

## 7. Purchase orders

Status flow: `pending → approved → received | cancelled`.
- `receive` is **idempotent** and appends `restock` events per line (ref = PO id).
- Only `approved` or `pending` can be received; already-received PO returns the same result (idempotency).

## 8. Wallet (Phase 1 — the honest framing)

> Brikoh does **not** hold merchant funds. The wallet mirrors Paystack's collected/settled balances. This framing must appear in UI copy and docs; never claim Brikoh "holds" funds.

- `available` = sum of settled ledger entries.
- `pending` = sum of unsettled `SALE_SETTLEMENT` entries (Paystack settles next business day; UI says "settles tomorrow").
- Withdrawals:
  - Only to **verified** bank accounts.
  - Flat fee **50** (NGN) shown before confirm; net = amount − fee.
  - `available` must cover amount + fee.
  - Creates `WITHDRAWAL` (−amount) + `FEE` (−50) ledger entries immediately; transfer executes via Paystack.
- Withdrawal statuses: `PENDING → PROCESSING → SUCCESSFUL | FAILED`.

## 9. Expenses & Profit & Loss

- P&L = `revenue(paid sales in period) − COGS(cost × units sold) − expenses(in period)`.
- Same date-range filters across revenue/expenses/P&L for consistency.
- Refunded sales excluded from revenue.
- Reports filterable by `period = week|month|quarter|year`.

## 10. Marketing

- Campaign message ≤ 480 chars.
- Audiences resolve at send time: `all` (all customers), `vip` (spent > ₦300k or configured), `wholesale`, `group:<id>`.
- Sending is async (queue); delivery/open tracked.
- Coupons: code `[A-Z0-9]`, unique per business; percentage or fixed; expiry; max uses; redemption count incremented atomically.

## 11. Storefront & checkout

- Only enabled templates render (ops-controlled).
- Products shown = `status=active` AND stock > 0 (per branch or total — use total across branches for online store; online orders decrement the **online branch**).
- Delivery: free ≥ ₦50,000 else ₦2,500.
- Stock is **reserved/decremented on payment success (webhook), not on checkout initiate** — avoids holding stock for abandoned carts; use idempotency to prevent double-decrement.
- On webhook success (web checkout):
  1. create/update `sales` (channel=STOREFRONT, method=card/transfer)
  2. create `payment_transactions` (status SUCCESS, paystack_reference unique)
  3. append `sale` stock events (online branch)
  4. `findOrCreateCustomer` (source=STOREFRONT)
  5. append `SALE_SETTLEMENT` ledger (settled=false)
  6. create `NEW_SALE` notification + audit
  7. send receipt (email/WhatsApp)
- Failure/abandon: no stock change; order stays unpaid; UI shows retry.

## 12. WhatsApp everywhere

- Storefront has a floating WhatsApp button → `https://wa.me/<digits>?text=...` using business.whatsapp (fallback phone).
- Product "Order on WhatsApp" links include product name/price.
- Customer detail has "Message on WhatsApp".
- Store the normalized digits; the frontend builds wa.me links client-side, backend only serves the number.

## 13. Google Analytics

- Connect via Measurement ID `G-XXXX` (validated).
- When connected, the storefront HTML must include the gtag snippet with that ID.
- GA metrics (sessions/users/pageviews) shown in merchant Analytics come from the GA4 Data API using server credentials.

## 14. Notifications (in-app)

Derived or event-driven alerts shown in the bell (Dashboard/Inventory/Money topbars):
- `OUT_OF_STOCK`, `LOW_STOCK` (≤ threshold), `EXPIRING_SOON` (≤ 7 days) — from products
- `PENDING_PO` — pending purchase orders
- `SETTLEMENT_PENDING` — unsettled ledger > 0
- `WITHDRAWAL_UPDATE` — status change
- `OWING_BALANCE` — customers owing > 0
- `NEW_SALE` — latest sale
Unread badge = count where read_at IS NULL. "Mark all read" sets read_at.

## 15. Onboarding (compulsory website)

Order: auth → business profile (name, category, location, money settings incl. **WhatsApp number**, business phone) → website (store name → `slug.brikoh.app`, template choice). On completion business created with `website_live=true`. Backend should accept an atomic `POST /business` with everything (mirroring the frontend's single save).

## 16. Ops console invariants

- **Revenue definition for Brikoh:**
  - `MRR` = Σ (active merchant × plan.monthly_price)
  - `ARR` = MRR × 12
  - `processingRevenue(30d)` = 1.5% × GMV(30d paid payments)
  - `total30d` = MRR + processingRevenue
  - Charts: subscriptions series vs processing series (12 months), by plan, by country, top merchants.
- **Feature flags with `gated=true`** (instant settlement, wallet interest) must refuse enabling without a logged compliance acknowledgement; and even then only when a banking partnership/license exists. Hard gate in code.
- Merchant suspension must block: login, new sales, withdrawals, API access (check on every request), and revoke active refresh tokens.

## 17. Audit logging

Every state-changing action logs: `{actor, action, detail, refId, businessId, at}`. Examples: `record_sale`, `restock`, `stock_adjustment`, `stock_transfer`, `payment_received`, `withdrawal_request`, `withdrawal_update`, `product_create/edit/delete/duplicate`, `bulk_upload`, `customer_auto`, `customer_note`, `staff_invite`, `expense_create`, `plan_update`, `flag_toggle`, `merchant_suspend`. Surface in both merchant audit view and admin console.
