# 05 — Payments, Paystack & Wallet (Phase 1 & 2)

## 1. Paystack account setup

- Production + test secret keys. Public keys served to the frontend for Paystack Inline only if used client-side; **recommended path is server-side Initialize** (keeps amounts tamper-proof).
- Enable webhooks for: `charge.success`, `transfer.success`, `transfer.failed`, `transfer.reversed`.

## 2. Server-side flow (recommended)

```
POST /api/v1/public/:websiteName/checkout/initiate
  → validate stock & compute total (+ delivery)
  → POST https://api.paystack.co/transaction/initialize
      { email, amount(minor units), reference, metadata:{ businessId, saleId/orderId, items } }
  → return { authorization_url, reference, orderId }

Customer pays on Paystack. Paystack calls our webhook:

POST /api/v1/payments/webhook
  → verify signature: HMAC SHA512 of raw body with PAYSTACK_SECRET (x-paystack-signature)
  → parse event
  → IF event == charge.success:
      BEGIN
        - if reference exists in payment_transactions → return 200 (idempotent)
        - verify transaction via GET /transaction/verify/:reference (amount matches)
        - create sale (channel=STOREFRONT, status=paid)
        - append sale stock events (online branch)
        - findOrCreateCustomer (source=STOREFRONT)
        - insert payment_transactions (status SUCCESS, fee, net)
        - append wallet_ledger SALE_SETTLEMENT (settled=false)
        - notification + audit + receipt email/WhatsApp
      COMMIT
  → ALWAYS return 200 quickly; do heavy work in a queue if needed.
```

## 3. Webhook security & idempotency

- **Verify signature** before trusting anything — never mark paid on client-side confirmation.
- **Idempotency:** `paystack_reference` is a unique index. A replayed webhook must return the original outcome (200) without double-crediting a sale, double-decrementing stock, or double-creating a ledger entry.
- Paystack can send more than once (retries). Handle gracefully.
- Store raw webhook payload + event id for audit/replay.

## 4. Fee math (mirror frontend)

- `paystack_fee = max(100, round(amount × 1.5%))`
- `net_amount = amount − paystack_fee`
- These feed: merchant wallet ledger (SALE_SETTLEMENT uses net) and **Brikoh's processing revenue (1.5% of GMV)**.

## 5. Wallet semantics (Phase 1 — visibility)

- `available` = Σ settled ledger entries (Paystack has already settled to merchant bank account).
- `pending` = Σ unsettled `SALE_SETTLEMENT`.
- Settlement timing: Paystack standard settlement to Nigerian bank is typically **next business day** — surface honestly ("Pending — expected in your account by [date]").
- Withdrawal (Phase 1): trigger Paystack **Transfer** to the merchant's verified bank:
  1. Create Transfer Recipient (or cache by bank_account + code).
  2. `POST /transfer` with amount (net after 50 fee), reference, recipient.
  3. Store `paystack_transfer_reference`; listen for `transfer.success`/`transfer.failed` webhooks → update status.
- Withdrawal fee: flat **50** (NGN), shown pre-confirm; net = amount − 50.

## 6. Bank account verification

- On add: call Paystack **Resolve Account Number** (`/bank/resolve?account_number&bank_code`) → returns account_name.
- Merchant confirms the resolved name → `isVerified=true`.
- Only verified accounts can be withdrawal destinations.

## 7. Phase 2 (True Wallet) — DO NOT BUILD YET

Instant settlement + interest require:
- A licensed banking/fintech partnership (e.g. PiggyVest-Business-style) OR a relevant CBN license, and
- The `instant_settlement` / `wallet_interest` feature flags **enabled by ops with compliance ack**.

When enabled, implement:
- `SALE_SETTLEMENT` ledger entries settle **immediately** via partner rails (webhook from partner).
- Scheduled job (daily) computes interest on average wallet balance → appends `INTEREST_PAYOUT` entries.
- Wallet balance stays **derived from the ledger** (same invariant as stock).
- Add `interest_rate` (e.g. 0.08 p.a.) + `accrued_interest` computed fields.
- Staff-level payment visibility controls and per-branch settlement tracking are also Phase 2.

**Hard gate:** feature flags table, `gated=true`, refuse enable without logged acknowledgement. Never ship Phase 2 logic active by default.

## 8. Reconciliation

- Every `payment_transactions` row must reference a `sale_id`; orphan payments (no matching sale) → flag for review, do not silently accept (business rule).
- Admin "Payments & withdrawals" screen lists both + approval action for withdrawals (mirrors `POST /admin/withdrawals/:id/approve`).

## 9. Testing checklist

- Webhook replay → no double stock/ledger/sale.
- Signature mismatch → 401 + logged.
- Amount mismatch on verify → FAILED + no stock change.
- Credit sale → no Paystack; owing tracked on customer.
- Withdrawal to unverified account → 422 `BANK_ACCOUNT_UNVERIFIED`.
- Withdrawal exceeding available → 422 `INSUFFICIENT_BALANCE`.
- Concurrent same-product sales → never oversell (row locks).
- P&L excludes refunded sales.
