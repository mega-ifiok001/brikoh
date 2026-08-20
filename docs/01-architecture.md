# 01 — Architecture & API Conventions

## 1. Suggested backend stack

- **Language:** Node.js + TypeScript (or NestJS) — matches the frontend, shared types possible.
- **Database:** PostgreSQL (recommended) — transactional integrity is essential (sales ↔ stock ↔ ledger).
- **ORM:** Prisma or Drizzle (with migrations).
- **Cache/queues:** Redis (rate limiting, campaign dispatch, notification fan-out). BullMQ for jobs.
- **Object storage:** S3-compatible (product images, CSV imports).
- **Payments:** Paystack (Payments, Transfers, Transfer Recipients, Account Resolution, Webhooks).
- **SMS/WhatsApp:** Termii/Twilio/360dialog (Meta WhatsApp Business API). Email: Resend/Postmark.
- **Hosting:** Dockerized services behind a load balancer; Postgres + Redis managed.

## 2. Service boundaries (monolith-first, modular)

A modular monolith is recommended for v1. Modules:

```
auth        → users, sessions, roles
business    → merchant profiles, onboarding, website settings
inventory   → products, stock_ledger, branches, categories, units, suppliers, POs
sales       → sales, credit/repayments
customers   → customers, groups, notes, import/export
payments    → paystack, transactions, wallet_ledger, withdrawals, bank accounts
accounting  → expenses, expense categories, reports
marketing   → campaigns, coupons, social links
analytics   → KPIs, GA4 linkage
storefront  → public storefront API, checkout
notifications → in-app + email/sms/whatsapp
ops         → platform admin: merchants, plans, flags, templates, tickets, revenue
```

Each module exposes an internal service interface; HTTP routes are thin adapters.

## 3. API conventions

### Base URL
`/api/v1` (public storefront endpoints under `/api/v1/public`).

### Authentication
- `Authorization: Bearer <access_token>` (JWT, short-lived ~15 min).
- Refresh via `POST /api/v1/auth/refresh` (refresh token in HTTP-only cookie or body).
- Platform admin uses the same mechanism with `role: "platform_admin"`.

### Standard response envelope
```json
{
  "data": { ... },
  "meta": { "page": 1, "pageSize": 20, "total": 134, "totalPages": 7 }
}
```

### Error envelope
```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found or does not belong to this business.",
    "field": "productId",          // optional — for validation errors
    "details": [ { "field": "name", "message": "Name is required" } ]
  }
}
```

Common error codes: `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `INSUFFICIENT_STOCK`, `BANK_ACCOUNT_UNVERIFIED`, `INSUFFICIENT_BALANCE`, `RATE_LIMITED`, `PAYMENT_FAILED`, `DUPLICATE_ENTRY`.

HTTP statuses: 200/201/204/400/401/403/404/409/422/429/500.

### Pagination, filtering, sorting (list endpoints)
- Pagination: `?page=1&pageSize=20` (max 100).
- Filtering: `?status=active&category=Beauty&branchId=b1`.
- Search: `?q=ankara` (ILIKE across searchable text columns).
- Sort: `?sort=-createdAt` (minus = descending). Whitelist allowed columns per endpoint.
- Responses return the `meta` object above.

### Idempotency
- `POST /api/v1/payments/initiate`, `POST /api/v1/sales`, `POST /api/v1/stock/restock` accept an `Idempotency-Key` header. Store the key; return the original result on replay.

### Dates
- ISO 8601 UTC. Date-only fields (`expiry`, expense `date`) are `YYYY-MM-DD`.

### Money
- All money is integer minor units (kobo/cent) OR decimal(12,2) with strict currency handling. Store `currency` (ISO 4217) on every money-bearing row. Frontend sends `amount` in **major units as number strings** and `currency`; backend converts. (Match the frontend: it displays `fmtMoney(currency, amount)`.)

### Concurrency
- Use row locks (`SELECT ... FOR UPDATE`) for: sale creation (stock check + ledger append), withdrawal (balance check), PO receive (restock append).

## 4. Multi-tenancy

- Every merchant table has `businessId` (UUID, indexed). All merchant-scoped queries MUST filter by `businessId` derived from the JWT — never trust client-supplied ids without a tenant check. This is the #1 security rule.

## 5. Feature flags (mirrors the Ops Console)

Store a `feature_flags` table (platform-wide). The frontend Admin console can toggle them; the backend reads flags and hard-gates behavior:

| Flag | Default | Behavior when on |
|---|---|---|
| `instant_settlement` | **off** | Phase 2 wallet instant credit via licensed banking partner. MUST stay off until a compliant partnership/license exists (hard gate, not just policy). |
| `wallet_interest` | **off** | Crediting `INTEREST_PAYOUT` ledger entries. Same licensing gate. |
| `allow_overselling` | off | Sales may exceed available stock. |
| `multi_branch` | on | Branches, stock transfers, per-branch settlement. |
| `marketing_campaigns` | on | Campaign/broadcast creation + send. |
| `ga_integration` | on | GA4 connect flow for merchants. |
| `staff_roles` | on | Role/permission enforcement on merchant tokens. |

## 6. Website templates & plans (ops-controlled)

- `website_templates` (classic / modern / bold) can be enabled/disabled by ops; the storefront & Website Studio must only expose enabled templates.
- `plans` (starter / pro / growth) with `monthly_price`, `quarterly_price`, `popular` flag are editable by ops and **must be what the public pricing page and subscription billing use**. No hardcoding prices server-side.

## 7. Observability

- Structured JSON logs with `requestId`, `businessId`, `userId`.
- OpenTelemetry traces across payment webhooks and report generation.
- Sentry for errors; Prometheus/Grafana for metrics (p99 latency, error rate, queue depth).
