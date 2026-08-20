# 06 — Security, Roles, Notifications & Operations

## 1. Authentication & sessions

- Passwords: argon2id (preferred) or bcrypt, cost ≥ 12.
- JWT access tokens: 15 min, signed HS256/RS256 with `aud`, `iss`, `sub`, `businessId`, `role`, `permissions[]`.
- Refresh tokens: random 256-bit, stored **hashed**, 30-day rotation, revocable.
- `users.status=suspended` or `businesses.status=suspended` ⇒ reject on every authenticated request (check from DB or a fast cache, not just token claims).
- Password reset codes: 6 digits, hashed, 15-min TTL, single use, rate-limited (≤ 5/hour/email).

## 2. Authorization (enforced server-side)

Merchant permission map (see `01-architecture.md`). Enforce per endpoint:
- `record_sales`: POST /sales, POST /sales/:id/payment
- `manage_products`: everything in inventory C
- `manage_staff`: staff invite/role changes
- `view_profit`: P&L and profit-bearing analytics

Platform admin endpoints are separate and require `role=platform_admin`; merchant tokens can never reach them (and vice-versa).

## 3. Multi-tenant isolation

- Every merchant query: `WHERE business_id = $jwt.businessId`. Never trust client-supplied `businessId`/ids to scope queries.
- Use Postgres RLS as defense-in-depth (policy: `business_id = current_setting('app.business_id')`).
- Object storage keys prefixed with `businessId/` — enforce in presigned-URL generation.

## 4. Input validation & safety

- Validate all input (zod/joi schemas per endpoint). Money as strings/decimals; dates ISO.
- File uploads: whitelist `image/jpeg|png|webp`, ≤ 5MB, virus-scan (ClamAV) optional, serve via CDN with `Content-Disposition` where relevant.
- Rate limiting: auth (login/forgot) 5/min/IP; checkout 10/min/IP; contact 3/min; general API 120/min/user.
- Bulk upload files parsed server-side; never eval CSV formulas (sanitize).

## 5. Webhooks

- Paystack: verify HMAC SHA512 signature; respond 200 fast; queue work.
- Never expose webhook URLs without signature verification.

## 6. Audit & compliance

- Append-only `audit_logs` (INSERT-only; no UPDATE/DELETE API).
- Record actor, action, detail, refId, businessId, ip (for auth events), at.
- Retain per financial-regulator expectations (e.g. 7 years for transaction records).

## 7. Notifications architecture

- **In-app:** `notifications` table; unread badge = `count(*) where read_at is null`. Push (FCM) optional.
- **Email:** Resend/Postmark — receipt on sale, campaign dispatch, password reset, withdrawal completed.
- **SMS/WhatsApp:** Termii/Twilio (SMS), 360dialog/Meta API (WhatsApp) — campaigns + transactional (order updates, receipts).
- Queue everything via BullMQ; delivery/open tracking updates campaign counters (idempotent).

## 8. Ops console guardrails

- Feature-flag toggle audit trail (`flag_toggle` audit entries with who/when).
- Merchant suspend: revoke refresh tokens, block login, reject API calls, stop campaign dispatch for that business.
- Revenue numbers must be computed from live data (plans × merchants + 1.5% of GMV) — not hardcoded.

## 9. Scaling notes

- Postgres: indexes listed in schema (tenant FK, stock_events (business, product, created_at), ledger (business, created_at), payments (business, paid_at)).
- Reports: materialize `financial_snapshots` daily; P&L for long ranges can read snapshots + recent granularity.
- Storefront is read-heavy → cache `GET /public/:websiteName` (Redis, TTL 60s) and products list (TTL 30s); bust on product publish/stock change.
- Campaign dispatch: chunk recipients, respect provider throughput, retry with backoff.

## 10. Environment & config

Env vars (never in code):
`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_WEBHOOK_SECRET`, `S3_BUCKET`, `S3_*`, `RESEND_API_KEY`, `TERMII_API_KEY`, `WHATSAPP_PROVIDER_*`, `GA4_SERVICE_ACCOUNT`, `GA4_PROPERTY_ID`, `APP_URL`, `FRONTEND_URL`.

## 11. Health & monitoring

- `GET /healthz` (liveness), `GET /readyz` (db/redis/paystack reachability).
- Request IDs, structured logs, p99 latency alerts, webhook-failure alerts, failed-withdrawal alerts, queue-depth alerts.
