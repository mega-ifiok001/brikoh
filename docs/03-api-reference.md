# 03 — API Reference

Base path `/api/v1`. All endpoints return the envelope from `01-architecture.md`. `Auth` = Bearer merchant JWT. `Admin` = platform admin JWT. `Public` = no auth. Currency codes sent alongside money values.

---

## A. Auth & account

| Method | Path | Auth | Body / Notes |
|---|---|---|---|
| POST | `/auth/signup` | — | `{name, email, password}` → 201 `{user, accessToken, refreshToken}`. Validates email, password ≥ 8, unique email. Auto-create `business`? **No** — business is created in onboarding. Creates user with role `owner`, no business yet. |
| POST | `/auth/login` | — | `{email, password}` → `{user, accessToken, refreshToken}`. 403 if user suspended. |
| POST | `/auth/refresh` | refresh | → new `{accessToken, refreshToken}`. |
| POST | `/auth/logout` | Auth | revokes refresh token. |
| GET | `/auth/me` | Auth | → `{user, business}` (business may be null pre-onboarding). |
| POST | `/auth/forgot-password` | — | `{email}` → 200 always (do not leak account existence). Sends 6-digit code. |
| POST | `/auth/reset-password` | — | `{email, code, newPassword}`. Code TTL 15 min; single-use. |

### Roles (merchant)
Permissions map:
- `owner`/`admin`: all
- `manager`: `view_profit`, `manage_products`, `record_sales`, `manage_staff`
- `cashier`: `record_sales`

The backend MUST enforce permission checks per endpoint (see `X-Permission` column below).

---

## B. Business / onboarding

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/business` | Auth | **Onboarding.** Body: `{name, category, country, city, currency, phone, whatsapp, websiteName, template, accent, heroTitle, heroSubtitle, tagline}`. Creates business, sets `website_live=true` (website creation is **compulsory**), slugifies `websiteName` → `websiteName.brikoh.app`. Validates `template` is enabled. |
| GET | `/business` | Auth | → full business profile. |
| PATCH | `/business` | Auth | Update profile fields (name, phone, whatsapp, currency, template, hero*, accent, tagline, websiteName…). If `template` changes, must be an enabled template. |
| GET | `/business/website-settings` | Auth | → `{template, heroTitle, heroSubtitle, tagline, accent, websiteName, websiteLive}` |

---

## C. Inventory

| Method | Path | Auth/Perm | Body / Notes |
|---|---|---|---|
| GET | `/products` | manage_products | Query: `q, category, status(draft/active), sort(-name,-price,-stock), page, pageSize`. Each item includes **computed** `totalStock` and per-branch stock. |
| POST | `/products` | manage_products | `{name, description, category, unit, costPrice?, sellingPrice, discountPrice?, threshold, expiry?, emoji, images[], variants?[], status}`. `images[0]` = cover. Publish requires name/category/unit/sellingPrice/images[0]. Starting stock: `{startingStock}` → creates `initial` stock event on default branch. Variants each create their own `initial` event. |
| GET | `/products/:id` | manage_products | Includes computed stock + variants stock. |
| PATCH | `/products/:id` | manage_products | Partial update. **Never** accepts stock fields. |
| DELETE | `/products/:id` | manage_products | Soft delete → `status=archived`. Sales history preserved. |
| POST | `/products/:id/duplicate` | manage_products | Copies all fields except: stock → 0, status → `draft`. Returns new product. |
| POST | `/products/:id/images` | manage_products | multipart upload → `{images: string[]}` (URLs). Reorder cover: PATCH `/products/:id` with reordered `images`. |
| GET | `/products/:id/stock-history` | manage_products | → `{events: [{id,type,delta,note,ref,user,at,branchId}], runningBalance[]}` most-recent-first. |
| POST | `/products/bulk-upload` | manage_products | multipart `.csv/.xlsx` ≤ 500 rows, ≤ 1MB → `{preview:{rows:[{row, name, error?}], readyCount, errorCount}}`. Rules: missing name → error; invalid price → error; duplicate existing name → **flagged, not silent** (frontend lets merchant skip or create-anyway). |
| POST | `/products/bulk-upload/confirm` | manage_products | `{rows:[valid rows]}` → creates products (+ initial stock events). Returns `{imported, skipped}`. |
| GET | `/categories` / `POST` | manage_products | create: `{name}` |
| GET | `/units` / `POST` | manage_products | create: `{name}` |
| GET | `/branches` / `POST` | manage_products | create: `{name, location}` |

### Stock operations (never direct editing)

| Method | Path | Perm | Notes |
|---|---|---|---|
| POST | `/stock/restock` | manage_products | `{productId, variantId?, branchId, quantity, supplierId?, note?}` → appends `restock` event (+delta). |
| POST | `/stock/adjustment` | manage_products | `{productId, variantId?, branchId, type: 'damage'\|'correction', quantity, note?}`. damage = −qty; correction = set-to → compute delta. Damage can't exceed current stock. |
| POST | `/stock/transfer` | manage_products | `{productId, variantId?, fromBranchId, toBranchId, quantity}`. Blocks if source lacks stock. Appends `transfer_out` (−) and `transfer_in` (+). |

### Suppliers & purchase orders

| Method | Path | Notes |
|---|---|---|
| GET/POST | `/suppliers` | create `{name, phone?, email?}` |
| GET | `/purchase-orders` | list with supplier/branch joined |
| POST | `/purchase-orders` | `{supplierId, branchId, items:[{productId, quantity, unitCost}]}` → total computed, status `pending`. |
| PATCH | `/purchase-orders/:id/status` | `{status: approved\|cancelled}` |
| POST | `/purchase-orders/:id/receive` | **Idempotent.** Marks `received` AND appends `restock` events (+qty, ref=PO id) for every line. Double-receive must be impossible (status guard + idempotency). |

---

## D. Sales & credit

| Method | Path | Perm | Notes |
|---|---|---|---|
| POST | `/sales` | record_sales | `{customerId? , customerName?, branchId, items:[{productId, variantId?, quantity, price}], discount, method: cash\|transfer\|card\|credit, paid}`. Checks stock per line unless `allow_overselling` flag. Auto-creates/links customer by phone if `customerPhone` provided (source=POS). If `method=credit`: status owing/partial, customer owing increases. Appends `sale` stock events. If card/transfer → triggers Paystack initiate + `payment_transactions`. Returns full sale + receipt id. |
| GET | `/sales` | record_sales | filters: `status, method, channel, from, to, q` |
| GET | `/sales/:id` | record_sales | |
| POST | `/sales/:id/payment` | record_sales | `{amount}` → partial/full repayment on credit sale. Updates `paid`, status → `partial`/`paid`. Never exceeds total. |
| GET | `/sales/:id/receipt` | record_sales | → printable receipt data (items, totals, business info). |

---

## E. Payments & wallet (Phase 1 — see 05-payments.md for Paystack detail)

| Method | Path | Notes |
|---|---|---|
| GET | `/wallet/balance` | → `{available, pending, currency}`. Available = settled ledger sum; pending = unsettled SALE_SETTLEMENT sum. |
| GET | `/wallet/transactions` | ledger entries, filters `type, from, to`. |
| GET | `/payments` | transaction log; filters `channel, status, from, to, q`. |
| GET | `/payments/:id` | includes sale + paystack reference. |
| GET | `/bank-accounts` | |
| POST | `/bank-accounts` | `{accountNumber, bankName, bankCode?}` → resolves account name via Paystack → `isVerified=true` if match confirmed. |
| PATCH | `/bank-accounts/:id/set-default` | |
| POST | `/withdrawals` | `{amount, bankAccountId}`. Validates verified bank, available ≥ amount + fee(50). Appends `WITHDRAWAL` (−amount) + `FEE` (−50) ledger entries. Creates Paystack transfer recipient + initiates transfer. Status PENDING→PROCESSING→SUCCESSFUL. |
| GET | `/withdrawals` | list with bank joined, statuses. |

---

## F. Expenses & reports

| Method | Path | Notes |
|---|---|---|
| GET/POST | `/expenses` | create `{category, amount, description?, date}`. |
| PATCH/DELETE | `/expenses/:id` | |
| GET/POST | `/expense-categories` | |
| GET | `/reports/revenue` | `?from&to&branchId?` → daily series + total. |
| GET | `/reports/expenses` | `?from&to` → by category + total. |
| GET | `/reports/profit-loss` | `?period=week\|month\|quarter\|year` → `{revenue, cogs, expenses, netProfit}`. **cogs** = Σ(units sold × product.cost_price) over paid sales in period; refunded sales excluded. |
| GET | `/reports/profit-loss/export` | → CSV/PDF download. |
| GET | `/reports/inventory-value` | `?branchId?` → Σ(stock × cost_price) + retail value. |
| GET | `/reports/low-stock` | products at/below threshold with stock. |
| GET | `/reports/expiring` | `?days=7` → products expiring within N days. |

---

## G. Customers

| Method | Path | Notes |
|---|---|---|
| GET | `/customers` | search `q`, filter `source, groupId, segment`, sort `-totalSpent, -lastPurchase`. Each row includes computed `{totalSpent, totalOrders, lastPurchaseDate, owingBalance, segment}`. |
| POST | `/customers` | `{name, phone, email?, groupIds?}`. Phone normalized unique per business → 409 on duplicate. source=MANUAL. |
| GET | `/customers/:id` | profile + computed stats + `{sales[], notes[], groups[]}`. |
| PATCH | `/customers/:id` | |
| DELETE | `/customers/:id` | soft delete (status=deleted). |
| POST | `/customers/:id/notes` | `{note}` |
| POST | `/customers/bulk-import` | csv `Name,Phone,Email,Group` → preview with duplicate-phone flagging. |
| POST | `/customers/bulk-import/confirm` | skips flagged duplicates unless `{skipDuplicates:false}` (then merge/link). |
| GET | `/customers/export` | CSV download respecting filters. |
| GET | `/customers/duplicates` | same normalized phone appearing twice (Phase 2). |
| POST | `/customers/merge` | `{primaryId, secondaryId}` — re-points sales, merges notes/groups, deletes secondary (Phase 2). |
| GET/POST | `/customer-groups` | create `{name, discountPct?}` |
| PATCH/DELETE | `/customer-groups/:id` | |
| POST | `/customer-groups/:id/members` / DELETE `.../:customerId` | |

---

## H. Marketing

| Method | Path | Notes |
|---|---|---|
| GET | `/campaigns` | list with audience labels. |
| POST | `/campaigns` | `{name, channel: whatsapp\|sms\|email, audience: all\|vip\|group\|wholesale, groupId?, message, scheduledAt?}` → validates message ≤ 480 chars; audience resolved to recipient list at send time. |
| POST | `/campaigns/:id/send` | Queues dispatch (job per recipient). Updates delivered/opened counts (via click/open pixels for email; delivery receipts for SMS/WhatsApp). |
| GET/POST | `/coupons` | create `{code, type, value, expires?, maxUses}`. Code unique per business. |
| PATCH | `/coupons/:id` | toggle active, edit value. |
| GET/PATCH | `/socials` | `{instagram, facebook, tiktok, website}`. |
| GET | `/marketing/stats` | → `{campaignsSent, reach, activeCoupons, redemptions}`. |

---

## I. Analytics

| Method | Path | Notes |
|---|---|---|
| GET | `/analytics/overview` | `?range=7d\|30d\|90d` → KPI cards + revenue series + top products + channels. |
| GET | `/analytics/top-products` | ranked by revenue, with progress pct. |
| GET | `/analytics/channels` | revenue by channel (Direct/Social/Marketplace/Referral). |
| POST | `/analytics/google-analytics` | `{measurementId}` validated `^G-[A-Z0-9]{6,}$` → stores `ga_connections`, returns verified. Backend injects the GA tag into the storefront HTML when connected. |
| DELETE | `/analytics/google-analytics` | disconnect. |
| GET | `/analytics/ga-metrics` | `?range` → sessions/users/pageviews (from GA4 API via service account). |

---

## J. Storefront (public)

| Method | Path | Notes |
|---|---|---|
| GET | `/public/:websiteName` | → storefront config: business name, template, accent, hero/tagline, whatsapp, contact info, socials, **enabled** template + connected GA id. |
| GET | `/public/:websiteName/products` | → active, in-stock products: `{id,name,description,category,unit,price,discountPrice,images,stock}`. |
| GET | `/public/:websiteName/products/:id` | single product + related (same category). |
| POST | `/public/:websiteName/checkout/initiate` | `{items:[{productId,qty}], customer:{name,phone,email?}, channel: CARD\|BANK_TRANSFER\|USSD\|QR}` → validates stock, computes totals (+ delivery fee: free ≥ ₦50k else ₦2.5k), calls Paystack initialize → `{paystackAuthorizationUrl, reference, orderId}`. Does NOT reduce stock yet (reduce on webhook success). |
| GET | `/public/:websiteName/order/:orderId/status` | checkout status for retry UI. |
| GET | `/public/:websiteName/checkout/verify?reference=` | **Optional client-side** verify; the backend source of truth is the webhook. |

---

## K. Notifications

| Method | Path | Notes |
|---|---|---|
| GET | `/notifications` | → latest ~50, `read_at` null = unread; computed list includes: OUT_OF_STOCK, LOW_STOCK, EXPIRING_SOON (7d), PENDING_PO, SETTLEMENT_PENDING, WITHDRAWAL_UPDATE, OWING_BALANCE, NEW_SALE. |
| POST | `/notifications/read` | `{ids:[]}` or `{all:true}` → marks read. |

The backend generates notifications on relevant events (sale created, stock event, withdrawal status change, payment webhook). Optionally compute low-stock/expiry alerts via a scheduled job (hourly) rather than on every read.

---

## L. Ops Console (platform admin)

| Method | Path | Notes |
|---|---|---|
| POST | `/admin/login` | `{email,password}` → admin token. |
| GET | `/admin/overview` | → merchants count (active/total), live products, GMV, wallet float (settled/pending), new tickets, feature-flag counts, platform activity feed (recent audit). |
| GET | `/admin/merchants` | search/filter status/plan, pagination. |
| PATCH | `/admin/merchants/:id/suspend` | suspends user + business; revokes sessions. |
| PATCH | `/admin/merchants/:id/activate` | |
| DELETE | `/admin/merchants/:id` | hard-remove (audited; prefer suspend). |
| GET | `/admin/revenue` | → `{mrr, arr, processingRevenue30d (1.5% of GMV), total30d, byPlan[], byCountry[], topMerchants[], 12mSeries{subscriptions, processing}}`, export CSV. |
| GET | `/admin/payments` | recent payments + wallet float. |
| POST | `/admin/withdrawals/:id/approve` | marks SUCCESSFUL + completedAt (mirrors Paystack transfer callback). |
| GET | `/admin/plans` / PUT | `{plans:[{id,monthly,quarterly,popular}]}` — public pricing reads these. |
| GET | `/admin/flags` / PATCH | toggle; gated flags refuse enable unless `{ackCompliance:true}` (logged). |
| GET | `/admin/templates` / PATCH | enable/disable `classic/modern/bold`. |
| GET | `/admin/tickets` / PATCH | support inbox; `{status: resolved\|new}`. |
| GET | `/admin/audit-logs` | platform + merchant audit, filterable. |

---

## M. Staff

| Method | Path | Notes |
|---|---|---|
| GET | `/staff` | list with roles + permissions. |
| POST | `/staff/invite` | `{name, email?, phone?, role}` → creates user linked to business with role permissions, sends invite. |
| PATCH | `/staff/:id/role` | `{role}` → updates permissions. Only owner/admin. |
| PATCH | `/staff/:id/active` | activate/deactivate (blocks login). |

---

## N. Audit log (merchant)

| Method | Path | Notes |
|---|---|---|
| GET | `/audit-logs` | `?action&from&to` → every stock change, sale, payment, staff change, settings change. |

---

## O. Support / contact (public)

| Method | Path | Notes |
|---|---|---|
| POST | `/contact` | `{name,email,topic,message}` → creates `support_tickets` (status=new), rate-limited. Email the support team. |

---

## P. Files & uploads

| Method | Path | Notes |
|---|---|---|
| POST | `/files` | Auth, multipart → `{url, key}`. Allowed mime types: jpeg/png/webp; ≤ 5MB. Presigned S3 upload recommended. Used for product images. |

---

## Q. Website Studio (auth)

| Method | Path | Notes |
|---|---|---|
| GET | `/website/templates` | → enabled templates + defaults (also used by storefront). |
| PATCH | `/business/website` | update template/copy/accent (same as business PATCH subset). |
| POST | `/website/publish` | validates template enabled + required fields → sets `website_live=true`, returns new site URL. |
