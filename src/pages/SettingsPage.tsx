import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { fd, titleCase } from "../lib/format";
import {
  Badge,
  Button,
  Confirm,
  Field,
  Icon,
  Input,
  PageHead,
  Select,
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

export default function SettingsPage() {
  const { refresh } = useAuth();
  const [tab, setTab] = useState("business");

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

    console.log("BANK ACCOUNTS API RESPONSE:", res);

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

function PlanTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [domain, setDomain] = useState("");
  const [domainBusy, setDomainBusy] = useState(false);

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

  useEffect(() => {
    load();
  }, [load]);

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

  const rows: {
    label: string;
    used: number;
    cap: number | null | undefined;
  }[] = [
    { label: "Staff", used: usage.staff ?? 0, cap: limits.staffCap },
    { label: "Locations", used: usage.locations ?? 0, cap: limits.locationCap },
    { label: "Products", used: usage.products ?? 0, cap: limits.productCap },
    { label: "Orders (period)", used: usage.orders ?? 0, cap: limits.orderCap },
  ];

  const capLabel = (cap: number | null | undefined) =>
    cap == null ? "Unlimited" : String(cap);

  const pct = (used: number, cap: number | null | undefined) => {
    if (cap == null || cap <= 0) return 0;
    return Math.min(100, Math.round((used / cap) * 100));
  };

  const barTone = (used: number, cap: number | null | undefined) => {
    if (cap == null) return "bg-leaf-500";
    const p = used / cap;
    if (p >= 1) return "bg-danger-500";
    if (p >= 0.8) return "bg-gold-500";
    return "bg-leaf-500";
  };

  if (!plan) {
    return (
      <div className="card anim-rise max-w-2xl p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100 text-gold-600">
            <Icon name="zap" size={20} />
          </span>
          <div>
            <p className="font-display text-lg font-extrabold">
              No active plan
            </p>
            <p className="text-sm text-ink-400">
              You’re running without subscription limits. Billing kicks in when
              you’re ready to grow.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Plan header */}
      <div className="card anim-rise p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-lg font-extrabold">
              {titleCase(plan.tier || "Starter")} plan
            </p>
            {period?.start && period?.end && (
              <p className="text-sm text-ink-400">
                Period {fd(period.start)} → {fd(period.end)}
              </p>
            )}
          </div>
          <Badge
            tone={
              plan.status === "ACTIVE"
                ? "green"
                : plan.status === "TRIALING"
                ? "brand"
                : plan.status === "PAST_DUE"
                ? "danger"
                : "neutral"
            }
          >
            {titleCase(plan.status || "—")}
          </Badge>
        </div>

        {/* Feature flags */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={flags.customDomain ? "green" : "neutral"}>
            Custom domain {flags.customDomain ? "✓" : "—"}
          </Badge>
          <Badge tone={flags.advancedAnalytics ? "green" : "neutral"}>
            Advanced analytics {flags.advancedAnalytics ? "✓" : "—"}
          </Badge>
          <Badge tone={flags.marketingTools ? "green" : "neutral"}>
            Marketing tools {flags.marketingTools ? "✓" : "—"}
          </Badge>
          <Badge tone="neutral">
            Templates: {capLabel(limits.templateCap)}
          </Badge>
        </div>
      </div>

      {/* Usage bars */}
      <div className="card anim-rise p-6">
        <h3 className="font-display text-base font-extrabold">Usage</h3>
        <p className="text-xs text-ink-400">
          Live counts against your plan caps. Hitting a cap blocks new creates
          until you upgrade.
        </p>
        <div className="mt-4 space-y-4">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-bold text-ink-700">{r.label}</span>
                <span className="tabular-nums text-ink-500">
                  <strong className="text-ink-800">{r.used}</strong>
                  {" / "}
                  {capLabel(r.cap)}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-cream-100">
                <div
                  className={`h-full rounded-full transition-all ${barTone(
                    r.used,
                    r.cap
                  )}`}
                  style={{
                    width:
                      r.cap == null
                        ? "8%"
                        : `${Math.max(4, pct(r.used, r.cap))}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom domain */}
      <div className="card anim-rise p-6">
        <h3 className="font-display text-base font-extrabold">
          Custom domain
        </h3>
        {!flags.customDomain ? (
          <p className="mt-2 text-sm text-ink-500">
            Custom domains are available on{" "}
            <strong>Pro</strong> and <strong>Enterprise</strong>. Upgrade to
            point your own domain at the storefront.
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs text-ink-400">
              Point a CNAME at your Brikoh storefront, then save the domain
              here.
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <Field label="Domain">
                  <Input
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="shop.yourbrand.com"
                  />
                </Field>
              </div>
              <Button loading={domainBusy} onClick={saveDomain} icon="check">
                Save domain
              </Button>
            </div>
          </>
        )}
      </div>

      <p className="text-center text-xs text-ink-400">
        Caps only block new creates — existing data is never deleted. Contact
        support to upgrade.
      </p>
    </div>
  );
}