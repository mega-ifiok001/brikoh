# Brikoh — Backend Implementation Specification

**Version:** 1.0 · **Prepared for:** Backend engineering team
**Frontend reference:** The complete Brikoh web + mobile product (React/Vite/Next.js + React Native-web)
**Companion specs (already written):** Payments/Wallet & Accounting · Customer Management · Inventory Management

---

## 1. What Brikoh is

Brikoh is an all-in-one business platform for merchants (inspired by Bumpa/Moniebook). A merchant:

1. Signs up → completes **onboarding** (business profile + compulsory free website with a template)
2. Runs an **online storefront** (3 templates, cart, Paystack checkout, WhatsApp ordering)
3. Manages **inventory** (products, stock ledger, transfers, suppliers, purchase orders, POS)
4. Sells and records sales (POS + web) — stock is always derived from a **stock ledger**
5. Manages **customers** (auto-created from sales, groups, notes, bulk import/export)
6. Collects payments via **Paystack** and sees them in a **Wallet** (Phase 1 = visibility layer)
7. Tracks **expenses** and reads **Profit & Loss** reports
8. Runs **marketing** (WhatsApp/SMS/email campaigns, coupons, social links)
9. Is overseen by the **Brikoh Ops Console** (admin panel): merchants, revenue (MRR/ARR/processing take), plans & pricing, feature flags, templates, support inbox

---

## 2. Documentation index

| File | Contents |
|---|---|
| `01-architecture.md` | System overview, tech stack, API conventions, auth, error handling |
| `02-database-schema.md` | Every table/entity with fields, types, relations, indexes |
| `03-api-reference.md` | Complete endpoint reference, grouped by module |
| `04-business-rules.md` | Invariants & flows the backend must enforce |
| `05-payments.md` | Paystack integration, wallet (Phase 1/2), webhooks, idempotency |
| `06-security-ops.md` | Security, roles, audit, notifications, scaling |

---

## 3. Core architectural principle (critical)

> **State that must never be stored as a mutable number, only derived from an append-only log:**

- **Stock quantity** → derived by summing `stock_events` (initial/restock/sale/damage/correction/transfer).
- **Wallet balance** → derived by summing `wallet_ledger` entries (SALE_SETTLEMENT / WITHDRAWAL / FEE / REFUND / REVERSAL / INTEREST_PAYOUT).
- **Customer `totalSpent`, `totalOrders`, `lastPurchaseDate`, `owingBalance`** → computed live from `sales`.

The frontend already behaves this way; the backend MUST as well (it's the source of truth).

---

## 4. Actors & roles

| Role | Scope | Capabilities |
|---|---|---|
| `owner` | Merchant account | Everything in their business |
| `admin` | Merchant account | Everything in their business |
| `manager` | Merchant account | view_profit, manage_products, record_sales, manage_staff |
| `cashier` | Merchant account | record_sales only |
| `platform_admin` | Brikoh company | Ops Console: merchants, revenue, plans, flags, templates, tickets, withdrawals |

Auth model: **JWT access + refresh tokens**. Merchant tokens carry `{ userId, businessId, role, permissions[] }`. Platform tokens carry `{ role: "platform_admin" }`.

---

## 5. Where the frontend maps to endpoints

Every screen the frontend ships with has a corresponding endpoint — the mapping is detailed in `03-api-reference.md`. Build the backend to these contracts and the existing frontend will connect with zero UI changes.
