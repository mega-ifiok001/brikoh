import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { asList, fd, pick, rawNum, titleCase } from "../lib/format";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  Money,
  PageHead,
  Select,
  StatCard,
  StatusBadge,
  toast,
} from "../components/ui";

export default function Wallet() {
  const [wallet, setWallet] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add bank account
  const [acctOpen, setAcctOpen] = useState(false);
  const [acctForm, setAcctForm] = useState({
    accountName: "",
    bankName: "",
    bankCode: "",
    accountNumber: "",
  });
  const [acctBusy, setAcctBusy] = useState(false);
  const [acctErr, setAcctErr] = useState("");

  // Withdraw
  const [wdOpen, setWdOpen] = useState(false);
  const [wdAmount, setWdAmount] = useState("");
  const [wdAccountId, setWdAccountId] = useState("");
  const [wdBusy, setWdBusy] = useState(false);
  const [wdErr, setWdErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    // 1. Wallet overview (contract)
    try {
      const res: any = await api.get("/api/dashboard/wallet");
      const w = res?.wallet ?? res;
      setWallet(w);
      setEntries(
        Array.isArray(res?.recentEntries)
          ? res.recentEntries
          : Array.isArray(w?.recentEntries)
          ? w.recentEntries
          : []
      );
    } catch (e: any) {
      setError(e?.message || "Couldn't load wallet.");
      setWallet(null);
      setEntries([]);
    }

    // 2. Withdrawals list (contract)
    try {
      const wRes: any = await api.get("/api/dashboard/wallet/withdrawals?limit=30");
      setWithdrawals(
        asList(wRes, "withdrawals", "items", "data")
      );
    } catch {
      setWithdrawals([]);
    }

    // 3. Bank accounts (best-effort — not in the contracts you shared yet)
    try {
      let aRes: any = null;
      try {
        aRes = await api.get("/api/dashboard/wallet/bank-accounts");
      } catch {
        aRes = await api.get("/api/dashboard/bank-accounts");
      }
      const list = asList(aRes, "bankAccounts", "accounts", "items", "data");
      setAccounts(list);
      setWdAccountId(
        (cur) =>
          cur ||
          list.find((a: any) => a.isDefault)?.id ||
          list[0]?.id ||
          ""
      );
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const available = wallet?.available ?? "0.00";
  const pending = wallet?.pending ?? "0.00";
  const withdrawn = wallet?.withdrawn ?? "0.00";
  const totalCredits = wallet?.totalCredits ?? "0.00";
  const currency = wallet?.currency || "NGN";

  // ---------- Add bank account ----------
  const addAccount = async () => {
    const digits = acctForm.accountNumber.replace(/\D/g, "");
    if (
      !acctForm.accountName.trim() ||
      !acctForm.bankName.trim() ||
      !acctForm.bankCode.trim() ||
      digits.length < 8
    ) {
      setAcctErr(
        "Fill in the account holder, bank, bank code and a full account number."
      );
      return;
    }
    setAcctBusy(true);
    setAcctErr("");
    try {
      const body = {
        accountName: acctForm.accountName.trim(),
        bankName: acctForm.bankName.trim(),
        bankCode: acctForm.bankCode.trim(),
        accountNumber: digits,
      };
      try {
        await api.post("/api/dashboard/wallet/bank-accounts", body);
      } catch {
        await api.post("/api/dashboard/bank-accounts", body);
      }
      toast.success("Bank account saved.");
      setAcctOpen(false);
      setAcctForm({
        accountName: "",
        bankName: "",
        bankCode: "",
        accountNumber: "",
      });
      load();
    } catch (e: any) {
      setAcctErr(e?.message || "Couldn't save the account.");
    } finally {
      setAcctBusy(false);
    }
  };

  // ---------- Withdraw (contract) ----------
  const withdraw = async () => {
    const amountNum = parseFloat(wdAmount);
    if (!isFinite(amountNum) || amountNum <= 0) {
      return setWdErr("Enter how much to withdraw.");
    }
    if (amountNum < 100) {
      return setWdErr("Minimum withdrawal is ₦100.00.");
    }
    if (!wdAccountId) {
      return setWdErr("Pick a bank account first.");
    }
    if (amountNum > rawNum(available)) {
      return setWdErr("Amount exceeds your available balance.");
    }

    setWdBusy(true);
    setWdErr("");
    try {
      await api.post("/api/dashboard/wallet/withdrawals", {
        bankAccountId: wdAccountId,
        amount: String(amountNum.toFixed(2)), // decimal string
      });
      toast.success("Withdrawal requested — money will be on its way shortly.");
      setWdOpen(false);
      setWdAmount("");
      load();
    } catch (e: any) {
      const msg =
        e?.code === "WITHDRAWAL_BELOW_MINIMUM"
          ? "Minimum withdrawal is ₦100.00."
          : e?.code === "INSUFFICIENT_WALLET_BALANCE"
          ? "Amount exceeds your available balance."
          : e?.code === "BANK_ACCOUNT_NOT_FOUND"
          ? "That bank account was not found."
          : e?.message || "Couldn't request the withdrawal.";
      setWdErr(msg);
    } finally {
      setWdBusy(false);
    }
  };

  const openWithdraw = () => {
    setWdAccountId(
      accounts.find((a) => a.isDefault)?.id || accounts[0]?.id || ""
    );
    setWdAmount("");
    setWdErr("");
    setWdOpen(true);
  };

  return (
    <div>
      <PageHead
        title="Wallet"
        sub="Online sales paid through Paystack land here. Cash, transfer and credit sales never touch this balance."
      >
        <Button variant="outline" icon="building" onClick={() => setAcctOpen(true)}>
          Bank account
        </Button>
        <Button
          icon="banknote"
          disabled={rawNum(available) < 100}
          onClick={openWithdraw}
        >
          Withdraw
        </Button>
      </PageHead>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
      ) : error ? (
        <div className="card">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card anim-rise overflow-hidden">
              <div className="bg-ink-900 p-5 text-cream-50">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-cream-100/60">
                  Available balance
                </p>
                <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">
                  <Money v={available} currency={currency} />
                </p>
                <p className="mt-1 text-xs text-cream-100/60">
                  Ready to withdraw (min ₦100)
                </p>
              </div>
            </div>

            <StatCard
              label="Pending"
              value={<Money v={pending} currency={currency} />}
              icon="clock"
              tone="gold"
              sub="Withdrawals in flight"
            />
            <StatCard
              label="Withdrawn"
              value={<Money v={withdrawn} currency={currency} />}
              icon="banknote"
              tone="neutral"
              sub="Successfully paid out"
            />
            <StatCard
              label="Total earned"
              value={<Money v={totalCredits} currency={currency} />}
              icon="chart"
              tone="green"
              sub="All online payments received"
            />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {/* Withdrawals */}
            <div className="card anim-rise overflow-hidden">
              <div className="border-b border-cream-200 px-5 py-3.5">
                <h3 className="font-display text-base font-extrabold">
                  Withdrawals
                </h3>
              </div>
              {withdrawals.length === 0 ? (
                <EmptyState
                  icon="banknote"
                  title="No withdrawals yet"
                  hint="Add a bank account, then pull money out whenever you like."
                />
              ) : (
                <div className="overflow-x-auto scrollbar-slim">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>To</th>
                        <th className="text-right">Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((p) => (
                        <tr key={p.id}>
                          <td className="font-mono text-xs font-bold">
                            {p.reference || "—"}
                          </td>
                          <td className="text-ink-500">
                            {p.bankAccount?.accountName || "—"}
                            {p.bankAccount?.bankName && (
                              <span className="block text-[11px] text-ink-400">
                                {p.bankAccount.bankName}{" "}
                                {p.bankAccount.maskedAccountNumber
                                  ? `· ${p.bankAccount.maskedAccountNumber}`
                                  : ""}
                              </span>
                            )}
                          </td>
                          <td className="text-right">
                            <Money v={p.amount} currency={currency} strong />
                          </td>
                          <td>
                            <StatusBadge status={p.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Ledger */}
            <div className="card anim-rise overflow-hidden">
              <div className="border-b border-cream-200 px-5 py-3.5">
                <h3 className="font-display text-base font-extrabold">
                  Wallet activity
                </h3>
                <p className="text-xs text-ink-400">
                  Last 25 ledger movements
                </p>
              </div>
              {entries.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm font-semibold text-ink-400">
                  Credits from online sales and debits from withdrawals appear
                  here.
                </p>
              ) : (
                <div>
                  {entries.slice(0, 15).map((e) => {
                    const isCredit =
                      (e.type || "").toUpperCase() === "CREDIT";
                    return (
                      <div
                        key={e.id}
                        className="flex items-center gap-3 border-b border-cream-100 px-5 py-3 last:border-0"
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold ${
                            isCredit
                              ? "bg-leaf-100 text-leaf-700"
                              : "bg-cream-100 text-ink-500"
                          }`}
                        >
                          {isCredit ? "+" : "−"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold">
                            {titleCase(
                              (e.source || "movement").replace(/_/g, " ")
                            )}
                          </p>
                          <p className="text-xs text-ink-400">
                            {fd(e.createdAt)} · bal{" "}
                            <Money v={e.balanceAfter} currency={currency} />
                          </p>
                        </div>
                        <span
                          className={`font-extrabold tabular-nums ${
                            isCredit ? "text-leaf-600" : "text-ink-700"
                          }`}
                        >
                          {isCredit ? "+" : "−"}
                          <Money v={e.amount} currency={currency} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bank accounts strip */}
          {accounts.length > 0 && (
            <div className="card anim-rise mt-5 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-extrabold">
                  Bank accounts
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="plus"
                  onClick={() => setAcctOpen(true)}
                >
                  Add account
                </Button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {accounts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-cream-200 px-4 py-3"
                  >
                    <div>
                      <p className="flex items-center gap-2 text-sm font-extrabold">
                        {a.accountName}
                        {a.isDefault && <Badge tone="dark">Default</Badge>}
                      </p>
                      <p className="text-xs text-ink-400">
                        {a.bankName} ·{" "}
                        {a.maskedAccountNumber ||
                          `****${String(a.accountNumber || "").slice(-4)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-ink-400">
            Only CARD / online payments through Paystack credit this wallet.
            Cash, bank transfer and credit sales never appear here.
          </p>
        </>
      )}

      {/* Add bank account modal */}
      <Modal
        open={acctOpen}
        onClose={() => setAcctOpen(false)}
        title="Add bank account"
        sub="We only store the last 4 digits — the full number is registered with Paystack."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAcctOpen(false)}>
              Cancel
            </Button>
            <Button loading={acctBusy} onClick={addAccount} icon="check">
              Save account
            </Button>
          </>
        }
      >
        {acctErr && (
          <p className="mb-3 rounded-xl bg-danger-100 px-3.5 py-2.5 text-sm font-semibold text-danger-700">
            {acctErr}
          </p>
        )}
        <div className="space-y-4">
          <Field label="Account holder name">
            <Input
              value={acctForm.accountName}
              onChange={(e) =>
                setAcctForm({ ...acctForm, accountName: e.target.value })
              }
              placeholder="As it appears on the account"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bank name">
              <Input
                value={acctForm.bankName}
                onChange={(e) =>
                  setAcctForm({ ...acctForm, bankName: e.target.value })
                }
                placeholder="e.g. GTBank"
              />
            </Field>
            <Field label="Bank code">
              <Input
                value={acctForm.bankCode}
                onChange={(e) =>
                  setAcctForm({ ...acctForm, bankCode: e.target.value })
                }
                placeholder="e.g. 058"
              />
            </Field>
          </div>
          <Field label="Account number">
            <Input
              value={acctForm.accountNumber}
              onChange={(e) =>
                setAcctForm({
                  ...acctForm,
                  accountNumber: e.target.value.replace(/\D/g, ""),
                })
              }
              placeholder="10 digits"
              inputMode="numeric"
            />
          </Field>
        </div>
      </Modal>

      {/* Withdraw modal */}
      <Modal
        open={wdOpen}
        onClose={() => setWdOpen(false)}
        title="Withdraw from wallet"
        sub={
          <span>
            Available: <Money v={available} currency={currency} strong />
          </span>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setWdOpen(false)}>
              Cancel
            </Button>
            <Button loading={wdBusy} onClick={withdraw} icon="banknote">
              Request withdrawal
            </Button>
          </>
        }
      >
        {wdErr && (
          <p className="mb-3 rounded-xl bg-danger-100 px-3.5 py-2.5 text-sm font-semibold text-danger-700">
            {wdErr}
          </p>
        )}
        {accounts.length === 0 ? (
          <div className="rounded-xl bg-gold-100 px-4 py-3 text-sm font-semibold text-gold-700">
            Add a bank account first, then come back to withdraw.
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="To account">
              <Select
                value={wdAccountId}
                onChange={(e) => setWdAccountId(e.target.value)}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountName} — {a.bankName}{" "}
                    {a.maskedAccountNumber ||
                      `****${String(a.accountNumber || "").slice(-4)}`}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Amount (NGN)">
              <Input
                type="number"
                min="100"
                step="0.01"
                value={wdAmount}
                onChange={(e) => setWdAmount(e.target.value)}
                autoFocus
                placeholder="100.00"
              />
            </Field>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWdAmount(String(rawNum(available).toFixed(2)))}
            >
              Max
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}