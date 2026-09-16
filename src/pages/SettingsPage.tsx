import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { fd, titleCase } from "../lib/format";
import {
  TIER_LABEL,
  isHigherTier,
  isLowerTier,
  tierMonthlyPrice,
} from "../lib/pricing";
import {
  Badge,
  Button,
  Confirm,
  Field,
  Icon,
  Input,
  Modal,
  Money,
  PageHead,
  Select,
  StatusBadge,
  Tabs,
  Toggle,
  toast,
} from "../components/ui";

const BUSINESS_TYPES = [
  "RETAIL",
  "FOOD_AND_BEVERAGE",
  "FASHION_AND_WEARABLES",
  "HEALTH_AND_BEAUTY",
  "ELECTRONICS",
  "PROFESSIONAL_SERVICES",
  "AGRICULTURE",
  "OTHER",
] as const;

const CURRENCIES = ["NGN", "USD", "GHS", "KES", "ZAR"] as const;

const TEMPLATES = ["CLASSIC", "MODERN", "BOLD"] as const;

const ACCENT_SWATCH = [
  "#18181b",
  "#16a34a",
  "#2563eb",
  "#ea580c",
  "#db2777",
  "#7c3aed",
  "#0d9488",
  "#dc2626",
] as const;

export default function SettingsPage({ initialTab }: { initialTab?: string }) {
  const { refresh } = useAuth();
  const [tab, setTab] = useState(initialTab === "plan" ? "plan" : "business");

  return (
    <div>
      <PageHead
        title="Settings"
        sub="Your account, your store, and how Brikoh pings you."
      />
      <Tabs
        tabs={[
          { id: "business", label: "Business" },
          { id: "storefront", label: "Storefront" },
          { id: "bank", label: "Bank accounts" },
          { id: "notifications", label: "Alerts" },
          { id: "account", label: "Account & password" },
          { id: "plan", label: "Plan" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "business" && <BusinessTab onSaved={refresh} />}
      {tab === "storefront" && <StorefrontTab />}
      {tab === "bank" && <BankAccountsTab />}
      {tab === "notifications" && <AlertsTab />}
      {tab === "account" && <AccountTab />}
      {tab === "plan" && <PlanTab />}
    </div>
  );
}

/* --------------------------------- Business --------------------------------- */

function BusinessTab({ onSaved }: { onSaved: () => Promise<void> | void }) {
  const [form, setForm] = useState({
    name: "",
    businessType: "RETAIL",
    location: "",
    currency: "NGN",
    businessPhone: "",
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/api/dashboard/settings/business");
      setForm({
        name: res.name || "",
        businessType: res.businessType || "RETAIL",
        location: res.location || "",
        currency: res.currency || "NGN",
        businessPhone: res.businessPhone || "",
      });
    } catch (e: any) {
      toast.error(e?.message || "Couldn't load business settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form.name.trim() || !form.location.trim() || !form.businessPhone.trim()) {
      toast.error("Store name, location and phone are required.");
      return;
    }
    setBusy(true);
    try {
      await api.put("/api/dashboard/settings/business", {
        name: form.name.trim(),
        businessType: form.businessType,
        location: form.location.trim(),
        currency: form.currency,
        businessPhone: form.businessPhone.trim(),
      });
      toast.success("Business details saved.");
      await onSaved();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't save those details.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="card max-w-2xl p-6">
        <div className="skeleton h-40" />
      </div>
    );
  }

  return (
    <div className="card anim-rise max-w-2xl p-6">
      <div className="space-y-4">
        <Field label="Store name">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>

        <Field label="Business type">
          <Select
            value={form.businessType}
            onChange={(e) =>
              setForm({ ...form, businessType: e.target.value })
            }
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {titleCase(t.replace(/_/g, " "))}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Location">
            <Input
              value={form.location}
              onChange={(e) =>
                setForm({ ...form, location: e.target.value })
              }
            />
          </Field>
          <Field label="Business phone">
            <Input
              value={form.businessPhone}
              onChange={(e) =>
                setForm({ ...form, businessPhone: e.target.value })
              }
              type="tel"
            />
          </Field>
        </div>

        <Field label="Currency">
          <Select
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex justify-end">
          <Button loading={busy} onClick={save} icon="check">
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Storefront -------------------------------- */

function StorefrontTab() {
  const [form, setForm] = useState({
    template: "CLASSIC",
    tagline: "",
    heroTitle: "",
    heroSubtitle: "",
    accentColor: "#18181b",
    whatsappButtonEnabled: false,
    whatsappNumber: "",
    showPoweredByBadge: true,
    ga4MeasurementId: "",
    socialLinks: {
      instagram: "",
      facebook: "",
      tiktok: "",
    },
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/api/dashboard/settings/storefront");
      setForm({
        template: res.template || "CLASSIC",
        tagline: res.tagline || "",
        heroTitle: res.heroTitle || "",
        heroSubtitle: res.heroSubtitle || "",
        accentColor: res.accentColor || "#18181b",
        whatsappButtonEnabled: !!res.whatsappButtonEnabled,
        whatsappNumber: res.whatsappNumber || "",
        showPoweredByBadge: res.showPoweredByBadge !== false,
        ga4MeasurementId: res.ga4MeasurementId || "",
        socialLinks: {
          instagram: res.socialLinks?.instagram || "",
          facebook: res.socialLinks?.facebook || "",
          tiktok: res.socialLinks?.tiktok || "",
        },
      });
    } catch (e: any) {
      toast.error(e?.message || "Couldn't load storefront settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    try {
      const payload: any = {
        template: form.template,
        tagline: form.tagline.trim() || null,
        heroTitle: form.heroTitle.trim() || null,
        heroSubtitle: form.heroSubtitle.trim() || null,
        accentColor: form.accentColor,
        whatsappButtonEnabled: form.whatsappButtonEnabled,
        whatsappNumber: form.whatsappNumber.trim() || null,
        showPoweredByBadge: form.showPoweredByBadge,
        ga4MeasurementId: form.ga4MeasurementId.trim() || null,
        socialLinks: {
          instagram: form.socialLinks.instagram.trim() || null,
          facebook: form.socialLinks.facebook.trim() || null,
          tiktok: form.socialLinks.tiktok.trim() || null,
        },
      };
      await api.put("/api/dashboard/settings/storefront", payload);
      toast.success("Storefront settings saved.");
    } catch (e: any) {
      toast.error(e?.message || "Couldn't save storefront settings.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="card max-w-2xl p-6">
        <div className="skeleton h-48" />
      </div>
    );
  }

  return (
    <div className="card anim-rise max-w-2xl p-6">
      <div className="space-y-4">
        <Field label="Template">
          <Select
            value={form.template}
            onChange={(e) => setForm({ ...form, template: e.target.value })}
          >
            {TEMPLATES.map((t) => (
              <option key={t} value={t}>
                {titleCase(t)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Tagline">
          <Input
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            placeholder="Short line under your store name"
            maxLength={80}
          />
        </Field>

        <Field label="Hero title">
          <Input
            value={form.heroTitle}
            onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
            placeholder="e.g. Fresh goods, daily"
            maxLength={60}
          />
        </Field>

        <Field label="Hero subtitle">
          <Input
            value={form.heroSubtitle}
            onChange={(e) =>
              setForm({ ...form, heroSubtitle: e.target.value })
            }
            placeholder="A little more about what you sell"
            maxLength={120}
          />
        </Field>

        <Field label="Accent color">
          <div className="flex flex-wrap gap-2">
            {ACCENT_SWATCH.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, accentColor: c })}
                className={`h-9 w-9 rounded-full border-2 transition ${
                  form.accentColor === c
                    ? "border-ink-900 scale-110"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </Field>

        <div className="flex items-center justify-between rounded-xl border border-cream-200 px-4 py-3">
          <div>
            <p className="text-sm font-extrabold">WhatsApp button</p>
            <p className="text-xs text-ink-400">
              Show a chat button on the storefront
            </p>
          </div>
          <Toggle
            checked={form.whatsappButtonEnabled}
            onChange={(v) =>
              setForm({ ...form, whatsappButtonEnabled: v })
            }
          />
        </div>

        {form.whatsappButtonEnabled && (
          <Field label="WhatsApp number">
            <Input
              value={form.whatsappNumber}
              onChange={(e) =>
                setForm({ ...form, whatsappNumber: e.target.value })
              }
              placeholder="+2348012345678"
              type="tel"
            />
          </Field>
        )}

        <div className="flex items-center justify-between rounded-xl border border-cream-200 px-4 py-3">
          <div>
            <p className="text-sm font-extrabold">“Powered by Brikoh” badge</p>
            <p className="text-xs text-ink-400">Shown in the storefront footer</p>
          </div>
          <Toggle
            checked={form.showPoweredByBadge}
            onChange={(v) =>
              setForm({ ...form, showPoweredByBadge: v })
            }
          />
        </div>

        <Field label="Google Analytics 4 ID" hint="Optional · e.g. G-ABCDE12345">
          <Input
            value={form.ga4MeasurementId}
            onChange={(e) =>
              setForm({ ...form, ga4MeasurementId: e.target.value })
            }
            placeholder="G-XXXXXXXX"
            className="font-mono"
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Instagram">
            <Input
              value={form.socialLinks.instagram}
              onChange={(e) =>
                setForm({
                  ...form,
                  socialLinks: {
                    ...form.socialLinks,
                    instagram: e.target.value,
                  },
                })
              }
              placeholder="https://instagram.com/…"
            />
          </Field>
          <Field label="Facebook">
            <Input
              value={form.socialLinks.facebook}
              onChange={(e) =>
                setForm({
                  ...form,
                  socialLinks: {
                    ...form.socialLinks,
                    facebook: e.target.value,
                  },
                })
              }
              placeholder="https://facebook.com/…"
            />
          </Field>
          <Field label="TikTok">
            <Input
              value={form.socialLinks.tiktok}
              onChange={(e) =>
                setForm({
                  ...form,
                  socialLinks: {
                    ...form.socialLinks,
                    tiktok: e.target.value,
                  },
                })
              }
              placeholder="https://tiktok.com/@…"
            />
          </Field>
        </div>

        <div className="flex justify-end">
          <Button loading={busy} onClick={save} icon="check">
            Save storefront
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Bank accounts ------------------------------ */

type BankAccount = {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  isDefault: boolean;
};

function BankAccountsTab() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    accountName: "",
    bankName: "",
    accountNumber: "",
    isDefault: false,
  });

 const load = useCallback(async () => {
  setLoading(true);

  try {
    const res: any = await api.get("/api/dashboard/settings/bank-accounts");


    setAccounts(Array.isArray(res) ? res : res.bankAccounts || []);
  } catch (e: any) {
    toast.error(e?.message || "Couldn't load bank accounts.");
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    const accountName = form.accountName.trim();
    const bankName = form.bankName.trim();
    const accountNumber = form.accountNumber.trim();

    if (!accountName || !bankName || !accountNumber) {
      toast.error("Account name, bank name and account number are required.");
      return;
    }
    if (!/^\d{10}$/.test(accountNumber)) {
      toast.error("Account number must be exactly 10 digits.");
      return;
    }

    setBusy(true);
    try {
      await api.post("/api/dashboard/settings/bank-accounts", {
        accountName,
        bankName,
        accountNumber,
        isDefault: form.isDefault,
      });
      toast.success("Bank account added.");
      setForm({
        accountName: "",
        bankName: "",
        accountNumber: "",
        isDefault: false,
      });
      await load();
    } catch (e: any) {
      const msg =
        e?.code === "VALIDATION_ERROR"
          ? "Check the fields — account number must be exactly 10 digits."
          : e?.message || "Couldn't add the bank account.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="card max-w-2xl p-6">
        <div className="skeleton h-40" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="card anim-rise p-6">
        <h3 className="font-display text-base font-extrabold">
          Settlement accounts
        </h3>
        <p className="mt-1 text-xs text-ink-400">
          Bank accounts customers pay into for manual bank transfers. The
          default account is shown at checkout. Without a default, bank-transfer
          checkout is unavailable.
        </p>

        {accounts.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-cream-200 px-4 py-6 text-center text-sm text-ink-400">
            No settlement accounts yet. Add one below.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {accounts.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-cream-200 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-extrabold">{a.accountName}</p>
                  <p className="text-xs text-ink-500">
                    {a.bankName} · {a.accountNumber}
                  </p>
                </div>
                {a.isDefault && (
                  <Badge tone="green">Default</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card anim-rise p-6">
        <h3 className="font-display text-base font-extrabold">
          Add bank account
        </h3>
        <div className="mt-4 space-y-4">
          <Field label="Account name">
            <Input
              value={form.accountName}
              onChange={(e) =>
                setForm({ ...form, accountName: e.target.value })
              }
              placeholder="e.g. Adebayo Idowu"
              maxLength={200}
            />
          </Field>
          <Field label="Bank name">
            <Input
              value={form.bankName}
              onChange={(e) =>
                setForm({ ...form, bankName: e.target.value })
              }
              placeholder="e.g. Access Bank"
              maxLength={200}
            />
          </Field>
          <Field label="Account number" hint="Exactly 10 digits">
            <Input
              value={form.accountNumber}
              onChange={(e) =>
                setForm({
                  ...form,
                  accountNumber: e.target.value.replace(/\D/g, "").slice(0, 10),
                })
              }
              placeholder="0123456789"
              inputMode="numeric"
              maxLength={10}
              className="font-mono"
            />
          </Field>
          <div className="flex items-center justify-between rounded-xl border border-cream-200 px-4 py-3">
            <div>
              <p className="text-sm font-extrabold">Set as default</p>
              <p className="text-xs text-ink-400">
                Used for bank-transfer checkouts. Only one default at a time.
              </p>
            </div>
            <Toggle
              checked={form.isDefault}
              onChange={(v) => setForm({ ...form, isDefault: v })}
            />
          </div>
          <div className="flex justify-end">
            <Button loading={busy} onClick={save} icon="check">
              Add account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Alerts ----------------------------------- */

function AlertsTab() {
  const [form, setForm] = useState({
    lowStockAlerts: true,
    paymentAlerts: true,
    expiringSoonAlerts: true,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/api/dashboard/settings/notifications");
      setForm({
        lowStockAlerts: res.lowStockAlerts !== false,
        paymentAlerts: res.paymentAlerts !== false,
        expiringSoonAlerts: res.expiringSoonAlerts !== false,
      });
    } catch (e: any) {
      toast.error(e?.message || "Couldn't load alert preferences.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    try {
      await api.put("/api/dashboard/settings/notifications", form);
      toast.success("Alert preferences saved.");
    } catch (e: any) {
      toast.error(e?.message || "Couldn't save alert settings.");
    } finally {
      setBusy(false);
    }
  };

  const rows = [
    {
      key: "lowStockAlerts" as const,
      title: "Low stock",
      body: "Email me when a product's stock falls to its alert threshold.",
    },
    {
      key: "paymentAlerts" as const,
      title: "Payments received",
      body: "Email me the moment money lands — online sales, credit repayments, invoice payments.",
    },
    {
      key: "expiringSoonAlerts" as const,
      title: "Expiring products",
      body: "Email me when something on the shelf is about to pass its expiry date.",
    },
  ];

  if (loading) {
    return (
      <div className="card max-w-2xl p-6">
        <div className="skeleton h-32" />
      </div>
    );
  }

  return (
    <div className="card anim-rise max-w-2xl p-6">
      <div className="space-y-4">
        {rows.map((r) => (
          <div
            key={r.key}
            className="flex items-start justify-between gap-4 rounded-xl border border-cream-200 px-4 py-3.5"
          >
            <div>
              <p className="text-sm font-extrabold">{r.title}</p>
              <p className="mt-0.5 text-xs text-ink-400">{r.body}</p>
            </div>
            <Toggle
              checked={form[r.key]}
              onChange={(v) => setForm({ ...form, [r.key]: v })}
            />
          </div>
        ))}
        <div className="flex justify-end">
          <Button loading={busy} onClick={save} icon="check">
            Save preferences
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Account ----------------------------------- */

function AccountTab() {
  const { me } = useAuth();
  const account = (me as any).account || {};

  const [pw, setPw] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [pwBusy, setPwBusy] = useState(false);

  const [delOpen, setDelOpen] = useState(false);
  const [delBusy, setDelBusy] = useState(false);

  const savePassword = async () => {
    if (pw.next.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (pw.next !== pw.confirm) {
      toast.error("New passwords don't match.");
      return;
    }
    setPwBusy(true);
    try {
      await api.post("/api/dashboard/settings/password", {
        currentPassword: pw.current,
        newPassword: pw.next,
        confirmPassword: pw.confirm,
      });
      setPw({ current: "", next: "", confirm: "" });
      toast.success("Password changed. Other sessions have been signed out.");
    } catch (e: any) {
      const msg =
        e?.code === "INVALID_CREDENTIALS"
          ? "Current password is incorrect."
          : e?.message || "Couldn't change the password.";
      toast.error(msg);
    } finally {
      setPwBusy(false);
    }
  };

  const deleteAccount = async () => {
    setDelBusy(true);
    try {
      await api.del("/api/dashboard/account");
      toast.success("Account deleted.");
      // hard redirect — session is gone
      window.location.href = "/";
    } catch (e: any) {
      toast.error(e?.message || "Couldn't delete the account.");
    } finally {
      setDelBusy(false);
      setDelOpen(false);
    }
  };

  return (
    <div className="grid max-w-4xl gap-5 lg:grid-cols-2">
      <div className="card anim-rise p-6">
        <h3 className="font-display text-base font-extrabold">Account</h3>
        <p className="mt-0.5 text-xs text-ink-400">{account.email || ""}</p>
        <p className="mt-4 text-sm text-ink-500">
          Profile fields (name, phone) are managed at signup. Password and
          account deletion live here.
        </p>
      </div>

      <div className="card anim-rise p-6">
        <h3 className="font-display text-base font-extrabold">
          Change password
        </h3>
        <div className="mt-4 space-y-4">
          <Field label="Current password">
            <Input
              type="password"
              value={pw.current}
              onChange={(e) => setPw({ ...pw, current: e.target.value })}
              autoComplete="current-password"
            />
          </Field>
          <Field label="New password">
            <Input
              type="password"
              value={pw.next}
              onChange={(e) => setPw({ ...pw, next: e.target.value })}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm new password">
            <Input
              type="password"
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              autoComplete="new-password"
            />
          </Field>
          <div className="flex justify-end">
            <Button loading={pwBusy} onClick={savePassword} icon="key">
              Update password
            </Button>
          </div>
        </div>
      </div>

      <div className="card anim-rise border-danger-100 p-6 lg:col-span-2">
        <h3 className="font-display text-base font-extrabold text-danger-600">
          Danger zone
        </h3>
        <p className="mt-1 text-sm text-ink-500">
          Permanently delete your account and the entire store — orders,
          products, customers, everything. This cannot be undone.
        </p>
        <Button
          variant="danger"
          className="mt-4"
          onClick={() => setDelOpen(true)}
        >
          Delete account
        </Button>
      </div>

      <Confirm
        open={delOpen}
        onClose={() => setDelOpen(false)}
        onConfirm={deleteAccount}
        loading={delBusy}
        title="Delete your account forever?"
        body="Your store, orders, stock, customers and staff will all be permanently removed."
        confirmLabel="Yes, delete everything"
      />
    </div>
  );
}

/* ----------------------------------- Plan ------------------------------------- */

/*
 * Tier copy for the self-serve billing UI. Prices, the tier ordering that
 * decides upgrade-vs-downgrade, and the cap figures all come from the shared
 * pricing module so this tab and the marketing landing page can never
 * disagree. See src/lib/pricing.ts for the canonical values.
 */
const TIERS = [
  {
    id: "STARTER",
    label: TIER_LABEL.STARTER,
    hint: "1 staff · 1 location · 100 products · 1,000 orders",
  },
  {
    id: "PRO",
    label: TIER_LABEL.PRO,
    hint: "10 staff · 3 locations · 500 products · 5,000 orders · custom domain",
  },
  {
    id: "ENTERPRISE",
    label: TIER_LABEL.ENTERPRISE,
    hint: "Unlimited everything · advanced analytics · marketing tools",
  },
] as const;

function PlanTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Domain
  const [domain, setDomain] = useState("");
  const [domainBusy, setDomainBusy] = useState(false);

  // Billing actions
  const [actionTab, setActionTab] = useState<"subscribe" | "upgrade" | "downgrade" | "cancel" | "history">("history");
  const initialCheckoutTier = (() => {
    try {
      const p = sessionStorage.getItem("brikoh.pendingPlan");
      if (p === "STARTER" || p === "PRO" || p === "ENTERPRISE") return p;
    } catch {
      /* storage unavailable */
    }
    return "PRO";
  })();
  const [checkoutTier, setCheckoutTier] = useState(initialCheckoutTier);
  useEffect(() => {
    try {
      sessionStorage.removeItem("brikoh.pendingPlan");
    } catch {
      /* storage unavailable */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState("ENTERPRISE");
  const [upgradeBusy, setUpgradeBusy] = useState(false);
  const [downgradeTier, setDowngradeTier] = useState("STARTER");
  const [downgradeBusy, setDowngradeBusy] = useState(false);
  const [downgradePreview, setDowngradePreview] = useState<any>(null);
  const [downgradePreviewBusy, setDowngradePreviewBusy] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);

  // Payments
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get("/api/dashboard/subscriptions/usage");
      setData(res);
      setDomain(res.customDomain || "");
    } catch (e: any) {
      if (e?.status === 403 || e?.code === "INSUFFICIENT_PERMISSIONS") {
        setError("Only the store owner can view plan usage.");
      } else {
        setError(e?.message || "Couldn't load plan usage.");
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const res: any = await api.get("/api/dashboard/subscriptions/payments");
      setPayments(
        (Array.isArray(res.items) ? res.items
          : Array.isArray(res) ? res
          : []) as any[]
      );
    } catch {
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  // Refresh after billing actions
  const afterAction = () => {
    load();
    loadPayments();
  };

  useEffect(() => {
    load();
    loadPayments();
    if (initialCheckoutTier !== "PRO") setActionTab("subscribe");
  }, [load, loadPayments]);

  const saveDomain = async () => {
    const value = domain.trim().toLowerCase() || null;
    setDomainBusy(true);
    try {
      await api.put("/api/dashboard/subscriptions/custom-domain", {
        customDomain: value,
      });
      toast.success(value ? "Custom domain saved." : "Custom domain cleared.");
      load();
    } catch (e: any) {
      const msg =
        e?.code === "PLAN_FEATURE_LOCKED"
          ? "Custom domains are not included in your plan. Upgrade to unlock."
          : e?.code === "SUBSCRIPTION_INACTIVE"
          ? "Your subscription is inactive. Reactivate to use this feature."
          : e?.code === "CUSTOM_DOMAIN_TAKEN"
          ? "That domain is already in use by another store."
          : e?.message || "Couldn't save the domain.";
      toast.error(msg);
    } finally {
      setDomainBusy(false);
    }
  };

  /* --------------------------- Checkout --------------------------- */

  const doCheckout = async () => {
    setCheckoutBusy(true);
    try {
      const res: any = await api.post("/api/dashboard/subscriptions/checkout", {
        tier: checkoutTier,
      });
      if (res.authorizationUrl) {
        window.location.assign(res.authorizationUrl);
      } else {
        toast.success(`Subscription initiated for ${checkoutTier}.`);
        afterAction();
      }
    } catch (e: any) {
      const msg =
        e?.code === "ALREADY_SUBSCRIBED"
          ? "You already have an active subscription."
          : e?.code === "PRICING_NOT_CONFIGURED"
            ? "This tier isn't available for checkout yet."
            : e?.message || "Couldn't start checkout.";
      toast.error(msg);
    } finally {
      setCheckoutBusy(false);
    }
  };

  /* --------------------------- Upgrade --------------------------- */

  const doUpgrade = async () => {
    setUpgradeBusy(true);
    try {
      const res: any = await api.post("/api/dashboard/subscriptions/upgrade", {
        tier: upgradeTier,
      });
      if (res.authorizationUrl) {
        window.location.assign(res.authorizationUrl);
      } else {
        toast.success(`Upgrade to ${upgradeTier} initiated.`);
        afterAction();
      }
    } catch (e: any) {
      const msg =
        e?.code === "UPGRADE_NOT_HIGHER"
          ? "That tier isn't higher than your current plan."
          : e?.code === "PRICING_NOT_CONFIGURED"
            ? "This tier isn't configured for upgrades yet."
            : e?.code === "PRORATION_ZERO"
              ? "No time left in your billing cycle."
              : e?.message || "Couldn't start upgrade.";
      toast.error(msg);
    } finally {
      setUpgradeBusy(false);
    }
  };

  /* --------------------------- Downgrade preview + action --------------------------- */

  const loadDowngradePreview = async (tier: string) => {
    setDowngradePreviewBusy(true);
    try {
      const res: any = await api.get(`/api/dashboard/subscriptions/downgrade/preview?tier=${encodeURIComponent(tier)}`);
      setDowngradePreview(res);
    } catch {
      setDowngradePreview(null);
    } finally {
      setDowngradePreviewBusy(false);
    }
  };

  const doDowngrade = async () => {
    setDowngradeBusy(true);
    try {
      await api.post("/api/dashboard/subscriptions/downgrade", {
        tier: downgradeTier,
      });
      toast.success(`Downgrade to ${downgradeTier} scheduled.`);
      afterAction();
    } catch (e: any) {
      const msg =
        e?.code === "DOWNGRADE_NOT_LOWER"
          ? "That tier isn't lower than your current plan."
          : e?.code === "PRICING_NOT_CONFIGURED"
            ? "This tier isn't configured for downgrades yet."
            : e?.message || "Couldn't schedule downgrade.";
      toast.error(msg);
    } finally {
      setDowngradeBusy(false);
    }
  };

  /* --------------------------- Cancel --------------------------- */

  const doCancel = async () => {
    setCancelBusy(true);
    try {
      await api.post("/api/dashboard/subscriptions/cancel");
      toast.success("Subscription cancelled.");
      setCancelConfirm(false);
      afterAction();
    } catch (e: any) {
      const msg =
        e?.code === "NO_SUBSCRIPTION"
          ? "You don't have an active subscription to cancel."
          : e?.code === "NO_PAYSTACK_SUBSCRIPTION"
            ? "No Paystack subscription found."
            : e?.message || "Couldn't cancel subscription.";
      toast.error(msg);
    } finally {
      setCancelBusy(false);
    }
  };

  /* --------------------------- Payment detail --------------------------- */

  const viewPayment = async (id: string) => {
    try {
      const res: any = await api.get(`/api/dashboard/subscriptions/payments/${id}`);
      setSelectedPayment(res);
    } catch (e: any) {
      toast.error(e?.message || "Couldn't load payment details.");
    }
  };

  /* --------------------------- Render --------------------------- */

  // Load downgrade preview when tab changes
  useEffect(() => {
    if (actionTab === "downgrade") {
      loadDowngradePreview(downgradeTier);
    }
  }, [actionTab, downgradeTier]);

  if (loading) {
    return (
      <div className="card max-w-2xl p-6">
        <div className="skeleton h-40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card max-w-2xl p-6">
        <p className="text-sm font-semibold text-danger-600">{error}</p>
        <Button className="mt-3" variant="outline" size="sm" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }





  const plan = data?.plan;
  const usage = data?.usage || {};
  const limits = plan?.limits || {};
  const flags = plan?.featureFlags || {};
  const period = data?.period;
  const currentTier = plan?.tier || "STARTER";
  const subscriptionStatus = plan?.status || "ACTIVE";
  const isActive = plan?.active === true;
  const pendingDowngrade = data?.pendingDowngrade;

  const rows = [
    { label: "Staff", used: usage.staff ?? 0, cap: limits.staffCap },
    { label: "Locations", used: usage.locations ?? 0, cap: limits.locationCap },
    { label: "Products", used: usage.products ?? 0, cap: limits.productCap },
    { label: "Orders (period)", used: usage.orders ?? 0, cap: limits.orderCap },
  ];

  const capLabel = (cap: number | null | undefined) =>
    cap == null ? "Unlimited" : String(cap);
  const pct = (u: number, c: number | null | undefined) => { if (c == null || c <= 0) return 0; return Math.min(100, Math.round((u/c)*100)); };
  const barTone = (u: number, c: number | null | undefined) => { if (c == null) return "bg-leaf-500"; const p=u/c; if(p>=1) return "bg-danger-500"; if(p>=0.85) return "bg-amber-500"; return "bg-leaf-500"; };

  const availableTiers = TIERS.map(t => t.id);
  const higherTiers = availableTiers.filter(t => isHigherTier(currentTier, t));
  const lowerTiers = availableTiers.filter(t => isLowerTier(currentTier, t));

  if (!plan) {
    return (
      <div className="card anim-rise max-w-2xl p-6"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100 text-gold-600"><Icon name="zap" size={20} /></span><div><p className="font-display text-lg font-extrabold">No active plan</p><p className="text-sm text-ink-400">You are running without subscription limits.</p></div></div></div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      {pendingDowngrade && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-start gap-3"><Icon name="alert" size={20} className="mt-0.5 text-amber-600" /><div className="min-w-0"><p className="text-sm font-bold text-amber-800">Downgrade scheduled to {pendingDowngrade.tier}</p><p className="mt-0.5 text-xs text-amber-700">Features switch on {new Date(pendingDowngrade.effectiveAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.</p></div></div></div>
      )}

      <div className="card anim-rise p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="font-display text-lg font-extrabold">{titleCase(plan.tier || "Starter")} plan</p>{period?.start && period?.end && <p className="text-sm text-ink-400">Period {fd(period.start)} to {fd(period.end)}</p>}</div>
          <Badge tone={subscriptionStatus==="ACTIVE"?"green":subscriptionStatus==="TRIALING"?"brand":subscriptionStatus==="PAST_DUE"?"danger":"neutral"}>{titleCase(subscriptionStatus || "—")}</Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={flags.customDomain?"green":"neutral"}>Custom domain {flags.customDomain?"✓":"—"}</Badge>
          <Badge tone={flags.advancedAnalytics?"green":"neutral"}>Advanced analytics {flags.advancedAnalytics?"✓":"—"}</Badge>
          <Badge tone={flags.marketingTools?"green":"neutral"}>Marketing tools {flags.marketingTools?"✓":"—"}</Badge>
          <Badge tone="neutral">Templates: {capLabel(limits.templateCap)}</Badge>
        </div>
      </div>

      <div className="card anim-rise p-6">
        <h3 className="font-display text-base font-extrabold">Usage</h3>
        <p className="text-xs text-ink-400">Live counts against your plan caps. Hitting a cap blocks new creates.</p>
        <div className="mt-4 space-y-4">
          {rows.map(r => (
            <div key={r.label}><div className="mb-1 flex items-center justify-between text-sm"><span className="font-bold text-ink-700">{r.label}</span><span className="tabular-nums text-ink-500"><strong className="text-ink-800">{r.used}</strong> {" / "} {capLabel(r.cap)}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-cream-100"><div className={"h-full rounded-full transition-all " + barTone(r.used, r.cap)} style={{ width: r.cap==null ? "8%" : `${Math.max(4,pct(r.used,r.cap))}%` }} /></div></div>
          ))}
        </div>
      </div>


      <div className="card anim-rise p-6">
        <div className="flex items-center gap-2"><Icon name="settings" size={18} className="text-ink-400" /><h3 className="font-display text-base font-extrabold">Subscription</h3></div>
        <p className="mt-0.5 text-xs text-ink-400">Subscribe, upgrade, downgrade, or cancel.</p>
        <div className="mt-4 flex gap-1 border-b border-cream-200">
          {[
            { id: "history", label: "History" },
            ...((isActive || !!plan?.tier) ? [
              { id: "upgrade", label: "Upgrade" },
              { id: "downgrade", label: "Downgrade" },
              { id: "cancel", label: "Cancel" },
            ] : [
              { id: "subscribe", label: "Subscribe" },
            ]),
          ].map(t => (
            <button key={t.id} onClick={() => setActionTab(t.id as any)} className={"border-b-2 px-3.5 py-2 text-sm font-bold transition-colors -mb-px " + (actionTab===t.id ? "border-brand-500 text-brand-600" : "border-transparent text-ink-400 hover:text-ink-700")}>{t.label}</button>
          ))}
        </div>

        {actionTab==="subscribe" && (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-ink-500">Choose a plan. Redirected to Paystack.</p>
            <div className="space-y-3">              {TIERS.map(t => (
                <label key={t.id} className={"flex items-start gap-3 rounded-xl border-2 px-4 py-3.5 transition-colors " + (checkoutTier===t.id ? "border-brand-500 bg-brand-50" : "border-cream-200 hover:border-cream-300")}>
                  <input type="radio" name="checkoutTier" value={t.id} checked={checkoutTier===t.id} onChange={e => setCheckoutTier(e.target.value)} className="mt-0.5" />
                  <div className="min-w-0"><p className="font-bold">{t.label}</p><p className="text-xs text-ink-400">{t.hint}</p><p className="mt-1 text-sm font-extrabold tabular-nums">{tierMonthlyPrice(t.id) != null ? (<><Money v={tierMonthlyPrice(t.id)} currency="NGN" strong /> /mo</>) : (<span className="text-ink-500">Custom pricing</span>)}</p></div>
                </label>
              ))}
            </div>
            <Button loading={checkoutBusy} onClick={doCheckout} icon="key" className="w-full">Start checkout</Button>
          </div>
        )}

        {actionTab==="upgrade" && (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-ink-500">Upgrade to a higher tier. Prorated charge applies.</p>
            {higherTiers.length===0 ? (<p className="rounded-xl bg-gold-50 px-4 py-3 text-sm font-semibold text-gold-700">Already on highest tier.</p>) : (
              <><div className="space-y-3">
                {higherTiers.map(t => (
                  <label key={t} className={"flex items-start gap-3 rounded-xl border-2 px-4 py-3.5 transition-colors " + (upgradeTier===t ? "border-brand-500 bg-brand-50" : "border-cream-200 hover:border-cream-300")}>
                    <input type="radio" name="upgradeTier" value={t} checked={upgradeTier===t} onChange={e => setUpgradeTier(e.target.value)} className="mt-0.5" />
                    <div className="min-w-0"><p className="font-bold">{titleCase(t)}</p><p className="text-xs text-ink-400">{TIERS.find(x => x.id===t)?.hint}</p></div>
                  </label>
                ))}
              </div>              <Button loading={upgradeBusy} onClick={doUpgrade} icon="zap" className="w-full">Upgrade now</Button></>
            )}
          </div>
        )}

        {actionTab==="downgrade" && (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-ink-500">Downgrade deferred. Keeps current tier until period end.</p>
            {lowerTiers.length===0 ? (<p className="rounded-xl bg-gold-50 px-4 py-3 text-sm font-semibold text-gold-700">Already on lowest tier.</p>) : (
              <><div className="space-y-3">
                {lowerTiers.map(t => (
                  <label key={t} className={"flex items-start gap-3 rounded-xl border-2 px-4 py-3.5 transition-colors " + (downgradeTier===t ? "border-brand-500 bg-brand-50" : "border-cream-200 hover:border-cream-300")}>
                    <input type="radio" name="downgradeTier" value={t} checked={downgradeTier===t} onChange={e => setDowngradeTier(e.target.value)} className="mt-0.5" />
                    <div className="min-w-0"><p className="font-bold">{titleCase(t)}</p><p className="text-xs text-ink-400">{TIERS.find(x => x.id===t)?.hint}</p></div>
                  </label>
                ))}
              </div>              {downgradePreview && downgradePreview.warnings?.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-bold text-amber-800">Changes at downgrade:</p><ul className="mt-2 space-y-1">{downgradePreview.warnings.map((w: any, i: number) => (<li key={i} className="text-sm text-amber-700">{w.message}</li>))}</ul></div>
              )}
              {downgradePreviewBusy && <div className="mt-3 flex items-center gap-2 text-sm text-ink-400"><div className="h-4 w-4 animate-spin rounded-full border-2 border-cream-200 border-t-brand-500" />Loading...</div>}
              <Button loading={downgradeBusy} onClick={doDowngrade} icon="clock" className="w-full">Schedule downgrade</Button>
              </>
            )}
          </div>
        )}

        {actionTab==="cancel" && (
          <div className="mt-5">
            <p className="text-sm text-ink-500">Cancels Paystack recurring subscription.</p>
            {!cancelConfirm ? (
              <Button variant="danger" onClick={() => setCancelConfirm(true)} className="mt-3 w-full">Cancel subscription</Button>
            ) : (
              <div className="mt-3 rounded-xl border border-danger-200 bg-danger-50 p-4"><p className="text-sm font-bold text-danger-700">Are you sure? Cannot be undone.</p><p className="mt-1 text-xs text-danger-600">Reverts to Starter after period end.</p><div className="mt-4 flex gap-2"><Button variant="ghost" onClick={() => setCancelConfirm(false)}>Go back</Button><Button variant="danger" loading={cancelBusy} onClick={doCancel}>Yes cancel</Button></div></div>
            )}
          </div>
        )}
      </div>
      <div className="card anim-rise p-6">
        <h3 className="font-display text-base font-extrabold">Billing history</h3>
        <p className="mt-0.5 text-xs text-ink-400">All subscription payments, upgrades, and renewals. Newest first.</p>
        {paymentsLoading ? (
          <div className="mt-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 skeleton rounded-xl" />)}</div>
        ) : payments.length === 0 ? (
          <p className="mt-4 rounded-xl bg-cream-50 px-4 py-6 text-center text-sm font-semibold text-ink-400">No billing activity yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto scrollbar-slim"><table className="tbl"><thead><tr><th>Reference</th><th>Tier</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th><th></th></tr></thead><tbody>
            {payments.map(p => (
              <tr key={p.id} className="cursor-pointer hover:bg-cream-50"><td><span className="font-mono text-xs font-bold">{p.reference || "—"}</span></td><td>{titleCase(p.tier)}</td><td><Badge tone="neutral">{titleCase(p.kind)}</Badge></td><td className="text-right tabular-nums"><Money v={p.amount} currency="NGN" /></td><td><StatusBadge status={p.status} /></td><td className="text-ink-400 text-xs">{fd(p.createdAt)}</td><td><Button variant="ghost" size="sm" icon="eye" onClick={() => viewPayment(p.id)} title="View details" /></td></tr>
            ))}
          </tbody></table></div>
        )}
      </div>

      <Modal open={!!selectedPayment} onClose={() => setSelectedPayment(null)} title="Payment details" wide>
        {selectedPayment && (
          <div className="space-y-4"><div className="grid grid-cols-2 gap-4">
            <Field label="Reference"><Input value={selectedPayment.reference || ""} disabled /></Field>
            <Field label="Tier"><Input value={titleCase(selectedPayment.tier)} disabled /></Field>
            <Field label="Type"><Input value={titleCase(selectedPayment.kind)} disabled /></Field>
            <Field label="Status"><Input value={titleCase(selectedPayment.status)} disabled /></Field>
            <Field label="Amount"><Input value={selectedPayment.amount || "0.00"} disabled /></Field>
            <Field label="Provider ref"><Input value={selectedPayment.providerRef || "—"} disabled /></Field>
          </div><div className="grid grid-cols-2 gap-4">
            <Field label="Created"><Input value={fd(selectedPayment.createdAt)} disabled /></Field>
            <Field label="Paid at"><Input value={fd(selectedPayment.paidAt)} disabled /></Field>
          </div>
          {selectedPayment.orphanReason && (<div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-bold text-amber-800">Orphan (no local effect)</p><p className="mt-1 text-xs text-amber-700">{selectedPayment.orphanReason}</p></div>)}
          </div>
        )}
      </Modal>

      <div className="card anim-rise p-6">
        <h3 className="font-display text-base font-extrabold">Custom domain</h3>
        {!flags.customDomain ? (
          <p className="mt-2 text-sm text-ink-500">Custom domains are available on <strong>Pro</strong> and <strong>Enterprise</strong>. Upgrade to point your own domain at the storefront.</p>
        ) : (
          <><p className="mt-1 text-xs text-ink-400">Point a CNAME at your Brikoh storefront, then save the domain here.</p><div className="mt-4 flex flex-wrap items-end gap-3"><div className="min-w-[220px] flex-1"><Field label="Domain"><Input value={domain} onChange={e => setDomain(e.target.value)} placeholder="shop.yourbrand.com" /></Field></div><Button loading={domainBusy} onClick={saveDomain} icon="check">Save domain</Button></div></>
        )}
      </div>

      <p className="text-center text-xs text-ink-400">Caps only block new creates. Existing data is never deleted. Contact support to upgrade.</p>
    </div>
  );}