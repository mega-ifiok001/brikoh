import { useCallback, useEffect, useMemo, useState } from "react";
import { api, API_BASE, getAccessToken } from "../lib/api";
import { asList, fd, pick, rawNum, titleCase, toISODate } from "../lib/format";
import DatePicker from "../components/DatePicker";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  KV,
  Modal,
  Money,
  PageHead,
  SearchInput,
  Select,
  Spinner,
  StatCard,
  StatusBadge,
  toast,
} from "../components/ui";

function initialTransactionDates() {
  const now = new Date();
  return {
    from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toISODate(now),
  };
}

function txDateLabel(value: any) {
  const date = String(value || "");
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return fd(date);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function txValue(item: any, ...keys: string[]) {
  for (const key of keys) {
    const value = key.split(".").reduce((current, part) => current?.[part], item);
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "";
}

export default function Wallet() {
  const [wallet, setWallet] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [initialDates] = useState(initialTransactionDates);
  const [from, setFrom] = useState(initialDates.from);
  const [to, setTo] = useState(initialDates.to);
  const [view, setView] = useState<"all" | "wallet">("wallet");
  const [direction, setDirection] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [branch, setBranch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionCursor, setTransactionCursor] = useState<string | null>(null);
  const [transactionLoading, setTransactionLoading] = useState(true);
  const [transactionLoadingMore, setTransactionLoadingMore] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [transactionDetail, setTransactionDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

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
    } catch (e: any) {
      setError(e?.message || "Couldn't load wallet.");
      setWallet(null);
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
        aRes = await api.get("/api/dashboard/wallet/bank-accounts");
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

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const transactionParams = (cursor?: string | null) => {
    const params = new URLSearchParams({ from, to, view, limit: "25" });
    if (direction) params.set("direction", direction);
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    if (method) params.set("method", method);
    if (branch) params.set("branch", branch);
    if (searchInput.trim()) params.set("search", searchInput.trim());
    if (cursor) params.set("cursor", cursor);
    return params;
  };

  const loadTransactions = useCallback(async (cursor?: string | null) => {
    if (!from || !to || from > to) {
      setTransactionError("Choose a valid date range: the start date must be on or before the end date.");
      setTransactionLoading(false);
      return;
    }
    if (cursor) setTransactionLoadingMore(true);
    else {
      setTransactionLoading(true);
      setTransactionCursor(null);
    }
    setTransactionError(null);
    try {
      const params = new URLSearchParams({ from, to, view, limit: "25" });
      if (direction) params.set("direction", direction);
      if (type) params.set("type", type);
      if (status) params.set("status", status);
      if (method) params.set("method", method);
      if (branch) params.set("branch", branch);
      if (search) params.set("search", search);
      if (cursor) params.set("cursor", cursor);
      const res: any = await api.get(`/api/dashboard/transactions?${params.toString()}`);
      const items = asList(res, "transactions", "items", "data");
      setTransactions((current) => cursor ? [...current, ...items] : items);
      setTransactionCursor(pick(res, ["nextCursor", "after", "cursor", "next"]) ?? null);
    } catch (e: any) {
      const message = e?.message || "Couldn't load transactions.";
      if (cursor) toast.error(message);
      else setTransactionError(message);
    } finally {
      setTransactionLoading(false);
      setTransactionLoadingMore(false);
    }
  }, [from, to, view, direction, type, status, method, branch, search]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const openTransaction = async (transaction: any) => {
    setSelectedTransaction(transaction);
    setTransactionDetail(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      const res = await api.get(`/api/dashboard/transactions/${encodeURIComponent(transaction.id)}`);
      setTransactionDetail(res?.transaction ?? res?.data?.transaction ?? res?.data ?? res);
    } catch (e: any) {
      setDetailError(e?.message || "Couldn't load transaction details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const exportTransactions = async () => {
    if (!from || !to || from > to) {
      toast.error("Choose a valid date range before exporting.");
      return;
    }
    const params = transactionParams();
    params.delete("limit");
    params.delete("cursor");
    try {
      const token = getAccessToken() || "";
      const response = await fetch(`${API_BASE}/api/dashboard/transactions/export.csv?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Couldn't export the transaction statement.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `transactions-${from}-to-${to}.csv`;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (e: any) {
      toast.error(e?.message || "Couldn't export the transaction statement.");
    }
  };

  const directionOptions = useMemo(() => [...new Set(transactions.map((item) => txValue(item, "direction")).filter(Boolean))], [transactions]);
  const typeOptions = useMemo(() => [...new Set(transactions.map((item) => txValue(item, "type", "transactionType")).filter(Boolean))], [transactions]);
  const statusOptions = useMemo(() => [...new Set(transactions.map((item) => txValue(item, "status")).filter(Boolean))], [transactions]);
  const methodOptions = useMemo(() => [...new Set(transactions.map((item) => txValue(item, "method", "paymentMethod")).filter(Boolean))], [transactions]);
  const branchOptions = useMemo(() => {
    const found = new Map<string, string>();
    transactions.forEach((item) => {
      const id = txValue(item, "branchId", "branch.id");
      const name = txValue(item, "branchName", "branch.name") || (id ? "Branch" : "Main branch");
      if (id) found.set(id, name);
    });
    return [...found.entries()];
  }, [transactions]);

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
        <Button data-tour-id="wallet-bank-account" variant="outline" icon="building" onClick={() => setAcctOpen(true)}>
          Bank account
        </Button>
        <Button
          data-tour-id="wallet-withdraw"
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
              value={<Money v={pending} currency={currency} compact />}
              icon="clock"
              tone="gold"
              sub="Withdrawals in flight"
            />
            <StatCard
              label="Withdrawn"
              value={<Money v={withdrawn} currency={currency} compact />}
              icon="banknote"
              tone="neutral"
              sub="Successfully paid out"
            />
            <StatCard
              label="Total earned"
              value={<Money v={totalCredits} currency={currency} compact />}
              icon="chart"
              tone="green"
              sub="All online payments received"
            />
          </div>

          <div className="mt-5">
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

          </div>

          {/* Transactions */}
          <section className="card anim-rise mt-5 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 px-5 py-4">
              <div>
                <h3 className="font-display text-base font-extrabold">Transactions</h3>
                <p className="text-xs text-ink-400">Search, filter, and export account activity.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-xl bg-cream-100 p-1">
                  {(["wallet", "all"] as const).map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => setView(scope)}
                      className={`rounded-lg px-3 py-2 text-xs font-extrabold transition ${view === scope ? "bg-white text-brand-700 shadow-sm" : "text-ink-500 hover:text-ink-900"}`}
                    >
                      {scope === "wallet" ? "Wallet only" : "All transactions"}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" icon="download" onClick={exportTransactions}>Export CSV</Button>
              </div>
            </div>

            <div className="space-y-4 border-b border-cream-100 px-5 py-4">
              <div className="flex flex-wrap items-end gap-3">
                <DatePicker label="From" value={from} onChange={setFrom} />
                <DatePicker label="To" value={to} onChange={setTo} />
                <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search transactions…" className="w-full sm:w-64" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Field label="Direction">
                  <Select value={direction} onChange={(event) => setDirection(event.target.value)}>
                    <option value="">All directions</option>
                    {directionOptions.map((option) => <option key={option} value={option}>{titleCase(option.replace(/_/g, " "))}</option>)}
                  </Select>
                </Field>
                <Field label="Type">
                  <Select value={type} onChange={(event) => setType(event.target.value)}>
                    <option value="">All types</option>
                    {typeOptions.map((option) => <option key={option} value={option}>{titleCase(option.replace(/_/g, " "))}</option>)}
                  </Select>
                </Field>
                <Field label="Status">
                  <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">All statuses</option>
                    {statusOptions.map((option) => <option key={option} value={option}>{titleCase(option.replace(/_/g, " "))}</option>)}
                  </Select>
                </Field>
                <Field label="Method">
                  <Select value={method} onChange={(event) => setMethod(event.target.value)}>
                    <option value="">All methods</option>
                    {methodOptions.map((option) => <option key={option} value={option}>{titleCase(option.replace(/_/g, " "))}</option>)}
                  </Select>
                </Field>
                <Field label="Branch">
                  <Select value={branch} onChange={(event) => setBranch(event.target.value)}>
                    <option value="">All branches</option>
                    {branchOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                  </Select>
                </Field>
              </div>
            </div>

            <div className="relative min-h-24">
              {transactionLoading && transactions.length > 0 && (
                <div className="pointer-events-none absolute inset-0 z-10 flex justify-center bg-white/50 pt-4 backdrop-blur-[1px]">
                  <span className="flex h-fit items-center gap-2 rounded-full border border-cream-200 bg-white px-3 py-2 text-xs font-bold text-ink-500 shadow-md"><Spinner size={14} />Refreshing transactions…</span>
                </div>
              )}
              {transactionLoading && transactions.length === 0 ? (
                <div className="space-y-2 p-5">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton h-11" />)}</div>
              ) : transactionError ? (
                <div className="p-5"><ErrorState message={transactionError} onRetry={() => loadTransactions()} /></div>
              ) : transactions.length === 0 ? (
                <EmptyState icon="banknote" title="No transactions found" hint="Try another date range or clear some filters." />
              ) : (
                <div className="overflow-x-auto scrollbar-slim">
                  <table className="tbl min-w-[850px]">
                    <thead><tr><th>Date</th><th>Transaction</th><th>Reference</th><th>Method</th><th>Branch</th><th>Status</th><th className="text-right">Amount</th></tr></thead>
                    <tbody>
                      {transactions.map((item) => {
                        const itemDirection = txValue(item, "direction").toUpperCase();
                        const isCredit = /credit|inbound|incoming|^in$/i.test(itemDirection) || (!itemDirection && rawNum(item.amount) >= 0);
                        const itemType = txValue(item, "type", "transactionType") || "Transaction";
                        const itemDate = txValue(item, "date", "createdAt", "occurredAt");
                        const itemBranch = txValue(item, "branchName", "branch.name") || "—";
                        return (
                          <tr key={item.id}>
                            <td className="whitespace-nowrap">{txDateLabel(itemDate)}</td>
                            <td>
                              <button type="button" onClick={() => openTransaction(item)} className="text-left font-extrabold text-brand-700 hover:underline">
                                {titleCase(itemType.replace(/_/g, " "))}
                              </button>
                              {txValue(item, "description") && <span className="block max-w-56 truncate text-xs text-ink-400">{txValue(item, "description")}</span>}
                            </td>
                            <td className="font-mono text-xs">{txValue(item, "reference", "referenceId", "id") || "—"}</td>
                            <td>{titleCase(txValue(item, "method", "paymentMethod").replace(/_/g, " ")) || "—"}</td>
                            <td>{itemBranch}</td>
                            <td>{txValue(item, "status") ? <StatusBadge status={txValue(item, "status")} /> : "—"}</td>
                            <td className={`text-right font-extrabold tabular-nums ${isCredit ? "text-leaf-700" : "text-ink-800"}`}>
                              {isCredit ? "+" : "−"}<Money v={Math.abs(rawNum(item.amount))} currency={currency} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {transactionCursor && (
                    <div className="border-t border-cream-100 px-5 py-4 text-center">
                      <Button variant="outline" size="sm" loading={transactionLoadingMore} onClick={() => loadTransactions(transactionCursor)}>Load more transactions</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

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

      {/* Transaction details */}
      <Modal
        open={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        title="Transaction details"
        sub={selectedTransaction ? `Transaction ${selectedTransaction.id}` : undefined}
        footer={<Button variant="outline" onClick={() => setSelectedTransaction(null)}>Close</Button>}
      >
        {detailLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm font-semibold text-ink-400"><Spinner size={18} />Loading transaction…</div>
        ) : detailError ? (
          <ErrorState message={detailError} onRetry={() => selectedTransaction && openTransaction(selectedTransaction)} />
        ) : transactionDetail ? (
          <div className="divide-y divide-cream-100">
            <KV label="Date" value={txDateLabel(txValue(transactionDetail, "date", "createdAt", "occurredAt") || txValue(selectedTransaction, "date", "createdAt"))} />
            <KV label="Type" value={titleCase(txValue(transactionDetail, "type", "transactionType") || txValue(selectedTransaction, "type", "transactionType") || "Transaction").replace(/_/g, " ")} />
            <KV label="Direction" value={titleCase(txValue(transactionDetail, "direction") || txValue(selectedTransaction, "direction") || "—")} />
            <KV label="Status" value={txValue(transactionDetail, "status") ? <StatusBadge status={txValue(transactionDetail, "status")} /> : "—"} />
            <KV label="Method" value={titleCase((txValue(transactionDetail, "method", "paymentMethod") || txValue(selectedTransaction, "method", "paymentMethod") || "—").replace(/_/g, " "))} />
            <KV label="Reference" value={txValue(transactionDetail, "reference", "referenceId") || txValue(selectedTransaction, "reference", "referenceId") || "—"} mono />
            <KV label="Branch" value={txValue(transactionDetail, "branchName", "branch.name") || txValue(selectedTransaction, "branchName", "branch.name") || "—"} />
            <KV label="Amount" value={<Money v={transactionDetail.amount ?? selectedTransaction?.amount} currency={currency} strong />} />
            <KV label="Description" value={txValue(transactionDetail, "description") || txValue(selectedTransaction, "description") || "—"} />
          </div>
        ) : null}
      </Modal>

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
