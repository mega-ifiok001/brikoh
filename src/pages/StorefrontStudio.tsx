import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { asList, cls, fd, rawNum, titleCase } from "../lib/format";
import {
  Badge,
  Button,
  Confirm,
  CopyBtn,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  IconBtn,
  Input,
  Modal,
  Money,
  PageHead,
  Select,
  StatusBadge,
  Tabs,
  toast,
} from "../components/ui";

export default function StorefrontStudio() {
  const { me, patchStore } = useAuth();
  const store = me.store || {};
  const [tab, setTab] = useState("storefront");

  return (
    <div>
      <PageHead
        title="Storefront"
        sub="Your public shop page — the template, the branding, the promos."
      />
      <Tabs
        tabs={[
          { id: "storefront", label: "Theme & branding" },
          { id: "campaigns", label: "Campaigns" },
          { id: "payments", label: "Online payments" },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === "storefront" && (
        <Studio store={store} patchStore={patchStore} />
      )}
      {tab === "campaigns" && <Campaigns />}
      {tab === "payments" && <Payments />}
    </div>
  );
}

/* ------------------------------ Theme & branding ---------------------------- */

function Studio({
  store,
  patchStore,
}: {
  store: any;
  patchStore: (p: Record<string, any>) => void;
}) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tier, setTier] = useState<string>("STARTER");
  const [visibleCount, setVisibleCount] = useState<number | null>(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState({
    accentColor: "#B45309",
    logoUrl: "",
    heroText: "",
    heroSubtext: "",
    announcementEnabled: false,
    announcementText: "",
  });
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);

  const previewUrl = store.subdomain
    ? `${location.origin}${location.pathname}#/s/${store.subdomain}`
    : "";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get("/api/dashboard/templates");
      setTemplates(Array.isArray(res.templates) ? res.templates : asList(res, "templates", "items"));
      setSelectedId(res.selectedTemplateId ?? null);
      setTier(res.tier || "STARTER");
      setVisibleCount(res.visibleCount ?? null);

      const s = res.settings || {};
      setDraft({
        accentColor: s.accentColor || "#B45309",
        logoUrl: s.logoUrl || "",
        heroText: s.heroText || "",
        heroSubtext: s.heroSubtext || "",
        announcementEnabled: !!s.announcementBar?.enabled,
        announcementText: s.announcementBar?.text || "",
      });
    } catch (e: any) {
      setError(e?.message || "Couldn't load templates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const applyTemplate = async (t: any) => {
    setApplying(t.id);
    try {
      await api.put("/api/dashboard/templates", { templateId: t.id });
      setSelectedId(t.id);
      patchStore({ templateId: t.id });
      toast.success(`Theme “${t.name}” applied.`);
    } catch (e: any) {
      const msg =
        e?.code === "TEMPLATE_NOT_AVAILABLE"
          ? "That template isn’t available on your plan."
          : e?.message || "Couldn't apply that template.";
      toast.error(msg);
    } finally {
      setApplying(null);
    }
  };

  const saveCustomization = async () => {
    setSaving(true);
    try {
      // Replace semantics — only include fields we want to keep
      const payload: any = {};
      if (draft.accentColor) payload.accentColor = draft.accentColor;
      if (draft.logoUrl.trim()) payload.logoUrl = draft.logoUrl.trim();
      if (draft.heroText.trim()) payload.heroText = draft.heroText.trim();
      if (draft.heroSubtext.trim()) payload.heroSubtext = draft.heroSubtext.trim();
      if (draft.announcementEnabled && draft.announcementText.trim()) {
        payload.announcementBar = {
          enabled: true,
          text: draft.announcementText.trim(),
        };
      }

      await api.put("/api/dashboard/templates/customization", payload);
      toast.success("Branding saved.");
    } catch (e: any) {
      toast.error(e?.message || "Couldn't save branding.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="anim-rise mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-leaf-100 bg-leaf-100/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-500 text-white">
            <Icon name="store" size={19} />
          </span>
          <div>
            <p className="font-display text-base font-extrabold text-leaf-700">
              {store.subdomain
                ? `${store.subdomain}.brikoh.com`
                : "No subdomain yet"}
            </p>
            <p className="text-xs text-leaf-700/70">
              {store.subdomain
                ? "Your customers shop here."
                : "Set one up in Settings → Business."}
            </p>
          </div>
        </div>
        {store.subdomain && (
          <div className="flex items-center gap-2">
            <CopyBtn text={previewUrl} label="Copy link" />
            <Button
              variant="dark"
              size="sm"
              icon="external"
              onClick={() => window.open(previewUrl, "_blank")}
            >
              Open preview
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-64" />
          ))}
        </div>
      ) : error ? (
        <div className="card">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-extrabold">
                Templates
              </h3>
              <Badge tone="neutral">
                {titleCase(tier)}
                {visibleCount != null ? ` · first ${visibleCount}` : " · all"}
              </Badge>
            </div>

            {templates.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon="image"
                  title="No templates published yet"
                  hint="Your storefront runs on the default layout until themes are released."
                />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {templates.map((t, i) => {
                  const active = t.id === selectedId;
                  return (
                    <div
                      key={t.id}
                      className={cls(
                        "card anim-rise overflow-hidden transition-all",
                        active && "ring-2 ring-brand-500"
                      )}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="relative h-36">
                        {t.previewUrl ? (
                          <img
                            src={t.previewUrl}
                            alt={t.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col gap-2 bg-gradient-to-br from-cream-100 to-brand-50 p-4">
                            <div className="h-3 w-2/3 rounded bg-cream-300" />
                            <div className="h-2 w-full rounded bg-cream-200" />
                            <div className="mt-auto grid grid-cols-3 gap-2">
                              <div className="h-10 rounded bg-white" />
                              <div className="h-10 rounded bg-white" />
                              <div className="h-10 rounded bg-white" />
                            </div>
                          </div>
                        )}
                        {active && (
                          <span className="absolute left-2 top-2 rounded-full bg-brand-500 px-2.5 py-1 text-[10px] font-extrabold uppercase text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold">
                            {t.name}
                          </p>
                          {t.description && (
                            <p className="truncate text-xs text-ink-400">
                              {t.description}
                            </p>
                          )}
                        </div>
                        {!active && (
                          <Button
                            size="sm"
                            onClick={() => applyTemplate(t)}
                            loading={applying === t.id}
                          >
                            Apply
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customization */}
          <div className="card anim-rise self-start p-5">
            <h3 className="font-display text-base font-extrabold">
              Branding
            </h3>
            <p className="mt-0.5 text-xs text-ink-400">
              Layered on top of the chosen template. Available on every plan.
            </p>
            <div className="mt-4 space-y-4">
              <Field label="Hero text">
                <Input
                  value={draft.heroText}
                  onChange={(e) =>
                    setDraft({ ...draft, heroText: e.target.value })
                  }
                  placeholder="Fresh from Lagos"
                  maxLength={80}
                />
              </Field>
              <Field label="Hero subtext">
                <Input
                  value={draft.heroSubtext}
                  onChange={(e) =>
                    setDraft({ ...draft, heroSubtext: e.target.value })
                  }
                  placeholder="Handpicked goods, delivered daily"
                  maxLength={160}
                />
              </Field>
              <Field label="Accent colour">
                <Input
                  value={draft.accentColor}
                  onChange={(e) =>
                    setDraft({ ...draft, accentColor: e.target.value })
                  }
                  placeholder="#B45309"
                  className="font-mono"
                />
              </Field>
              <Field label="Logo URL" hint="HTTPS URL from your uploads.">
                <Input
                  value={draft.logoUrl}
                  onChange={(e) =>
                    setDraft({ ...draft, logoUrl: e.target.value })
                  }
                  placeholder="https://…"
                />
              </Field>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={draft.announcementEnabled}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      announcementEnabled: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-brand-500"
                />
                Announcement bar
              </label>
              {draft.announcementEnabled && (
                <Field label="Announcement text">
                  <Input
                    value={draft.announcementText}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        announcementText: e.target.value,
                      })
                    }
                    placeholder="Free delivery on orders over ₦50,000"
                    maxLength={140}
                  />
                </Field>
              )}
              <Button
                className="w-full"
                loading={saving}
                onClick={saveCustomization}
                icon="check"
              >
                Save branding
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Campaigns ------------------------------- */

function Campaigns() {
  const currency = "NGN";
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: "",
    bannerTitle: "",
    bannerSubtitle: "",
    ctaLabel: "Shop the sale",
    startsAt: "",
    endsAt: "",
    discountId: "",
    isActive: true,
  });
  const [formBusy, setFormBusy] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [delFor, setDelFor] = useState<any | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        api.get("/api/dashboard/campaigns"),
        api.get("/api/dashboard/campaigns/stats").catch(() => null),
      ]);
      setItems(asList(listRes, "items", "campaigns", "data"));
      setStats(statsRes);
    } catch (e: any) {
      setError(e?.message || "Couldn't load campaigns.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    api
      .get("/api/dashboard/discounts?limit=100")
      .then((res) => setDiscounts(asList(res, "items", "discounts", "data")))
      .catch(() => setDiscounts([]));
  }, [load]);

  const isLive = (c: any) => {
    if (c.isActive === false) return false;
    const now = Date.now();
    if (c.startsAt && new Date(c.startsAt).getTime() > now) return false;
    if (c.endsAt && new Date(c.endsAt).getTime() < now) return false;
    return true;
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      bannerTitle: "",
      bannerSubtitle: "",
      ctaLabel: "Shop the sale",
      startsAt: "",
      endsAt: "",
      discountId: "",
      isActive: true,
    });
    setFormErr("");
    setFormOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      name: c.name || "",
      bannerTitle: c.bannerTitle || "",
      bannerSubtitle: c.bannerSubtitle || "",
      ctaLabel: c.ctaLabel || "Shop the sale",
      startsAt: c.startsAt ? String(c.startsAt).slice(0, 10) : "",
      endsAt: c.endsAt ? String(c.endsAt).slice(0, 10) : "",
      discountId: c.discountId || "",
      isActive: c.isActive !== false,
    });
    setFormErr("");
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) return setFormErr("Give the campaign a name.");
    setFormBusy(true);
    setFormErr("");

    const payload: any = {
      name: form.name.trim(),
      isActive: form.isActive,
      bannerTitle: form.bannerTitle.trim() || null,
      bannerSubtitle: form.bannerSubtitle.trim() || null,
      ctaLabel: form.ctaLabel.trim() || null,
      startsAt: form.startsAt
        ? new Date(form.startsAt + "T00:00:00.000Z").toISOString()
        : null,
      endsAt: form.endsAt
        ? new Date(form.endsAt + "T23:59:59.999Z").toISOString()
        : null,
      discountId: form.discountId || null,
    };

    try {
      if (editing) {
        await api.put(`/api/dashboard/campaigns/${editing.id}`, payload);
        toast.success("Campaign updated.");
      } else {
        await api.post("/api/dashboard/campaigns", payload);
        toast.success("Campaign created.");
      }
      setFormOpen(false);
      load();
    } catch (e: any) {
      setFormErr(e?.message || "Couldn't save the campaign.");
    } finally {
      setFormBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!delFor) return;
    setDelBusy(true);
    try {
      await api.del(`/api/dashboard/campaigns/${delFor.id}`);
      toast.success("Campaign deleted.");
      setDelFor(null);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't delete the campaign.");
    } finally {
      setDelBusy(false);
    }
  };

  return (
    <div>
      {/* Stats header */}
      {stats && (
        <div className="mb-5 grid gap-3 sm:grid-cols-4">
          <div className="card p-4">
            <p className="text-[11px] font-bold uppercase text-ink-400">
              Campaigns
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold">
              {stats.totalCampaigns ?? 0}
              <span className="ml-1 text-sm font-semibold text-ink-400">
                ({stats.activeCampaigns ?? 0} live)
              </span>
            </p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] font-bold uppercase text-ink-400">
              Active coupons
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold">
              {stats.activeCoupons ?? 0}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] font-bold uppercase text-ink-400">
              Redemptions
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold">
              {stats.totalRedemptions ?? 0}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] font-bold uppercase text-ink-400">
              Attributed revenue
            </p>
            <p className="mt-1 font-display text-xl font-extrabold">
              <Money
                v={(stats.campaigns || []).reduce(
                  (a: number, c: any) => a + rawNum(c.attributedRevenue),
                  0
                )}
                currency={currency}
              />
            </p>
          </div>
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <Button icon="plus" onClick={openCreate}>
          New campaign
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : error ? (
        <div className="card">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="gift"
            title="No campaigns"
            hint="A campaign is a promo banner on your storefront, optionally tied to a coupon code."
            action={
              <Button icon="plus" onClick={openCreate}>
                Create a campaign
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((c) => {
            const perf = (stats?.campaigns || []).find(
              (s: any) => s.id === c.id
            );
            return (
              <div
                key={c.id}
                className="card anim-rise flex flex-wrap items-center gap-4 p-4"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon name="gift" size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-extrabold">
                    {c.name}
                    {isLive(c) ? (
                      <Badge tone="green">Live</Badge>
                    ) : (
                      <Badge tone="neutral">Off</Badge>
                    )}
                  </p>
                  <p className="truncate text-sm text-ink-400">
                    {c.bannerTitle || "No banner title"}
                    {c.discountCode ? ` · code ${c.discountCode}` : ""}
                    {c.startsAt || c.endsAt
                      ? ` · ${fd(c.startsAt)} → ${fd(c.endsAt)}`
                      : " · evergreen"}
                  </p>
                  {perf && (
                    <p className="mt-0.5 text-xs text-ink-400">
                      {perf.redemptions} redemptions ·{" "}
                      {perf.attributedOrders} orders ·{" "}
                      <Money
                        v={perf.attributedRevenue}
                        currency={currency}
                      />
                    </p>
                  )}
                </div>
                <div className="flex gap-0.5">
                  <IconBtn
                    name="edit"
                    label="Edit"
                    onClick={() => openEdit(c)}
                  />
                  <IconBtn
                    name="trash"
                    label="Delete"
                    className="hover:bg-danger-100 hover:text-danger-500"
                    onClick={() => setDelFor(c)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit — ${editing.name}` : "New campaign"}
        sub="Shown on your storefront while it's live."
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={formBusy} onClick={submit} icon="check">
              Save campaign
            </Button>
          </>
        }
      >
        {formErr && (
          <p className="mb-3 rounded-xl bg-danger-100 px-3.5 py-2.5 text-sm font-semibold text-danger-700">
            {formErr}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Eid sale"
              autoFocus
            />
          </Field>
          <Field label="Linked coupon" hint="Optional — the banner carries this code.">
            <Select
              value={form.discountId}
              onChange={(e) =>
                setForm({ ...form, discountId: e.target.value })
              }
            >
              <option value="">No coupon</option>
              {discounts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.code ? ` (${d.code})` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Banner title" className="sm:col-span-2">
            <Input
              value={form.bannerTitle}
              onChange={(e) =>
                setForm({ ...form, bannerTitle: e.target.value })
              }
              placeholder="Half price this weekend"
              maxLength={80}
            />
          </Field>
          <Field label="Banner subtitle" className="sm:col-span-2">
            <Input
              value={form.bannerSubtitle}
              onChange={(e) =>
                setForm({ ...form, bannerSubtitle: e.target.value })
              }
              placeholder="On everything over ₦10,000"
              maxLength={80}
            />
          </Field>
          <Field label="Button label">
            <Input
              value={form.ctaLabel}
              onChange={(e) =>
                setForm({ ...form, ctaLabel: e.target.value })
              }
              maxLength={80}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts">
              <Input
                type="date"
                value={form.startsAt}
                onChange={(e) =>
                  setForm({ ...form, startsAt: e.target.value })
                }
              />
            </Field>
            <Field label="Ends">
              <Input
                type="date"
                value={form.endsAt}
                onChange={(e) =>
                  setForm({ ...form, endsAt: e.target.value })
                }
              />
            </Field>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) =>
              setForm({ ...form, isActive: e.target.checked })
            }
            className="h-4 w-4 accent-brand-500"
          />
          Active
        </label>
      </Modal>

      <Confirm
        open={!!delFor}
        onClose={() => setDelFor(null)}
        onConfirm={confirmDelete}
        loading={delBusy}
        title={`Delete “${delFor?.name || ""}”?`}
        body="The banner disappears from your storefront. Linked discount codes stay."
        confirmLabel="Delete campaign"
      />
    </div>
  );
}

/* ----------------------------------- Payments -------------------------------- */

function Payments() {
  const [status, setStatus] = useState<any>(null);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get("/api/dashboard/payments/provider");
      setStatus(res);
      if (res.publicKey) setPublicKey(res.publicKey);
    } catch (e: any) {
      if (e?.status === 403) {
        setError("Only the store owner can manage payment keys.");
      } else {
        setError(e?.message || "Couldn't load payment settings.");
      }
    }
    try {
      const sRes: any = await api.get("/api/dashboard/payments/settlements");
      setSettlements(
        Array.isArray(sRes?.settlements) ? sRes.settlements : []
      );
    } catch {
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const configured = status?.configured === true;

  const save = async () => {
    if (!publicKey.trim() || !secretKey.trim()) {
      toast.error("Enter both your public and secret keys.");
      return;
    }
    setSaving(true);
    try {
      await api.put("/api/dashboard/payments/provider", {
        provider: "paystack",
        publicKey: publicKey.trim(),
        secretKey: secretKey.trim(),
      });
      toast.success(
        "Payment keys saved — your storefront can now take card payments."
      );
      setSecretKey(""); // never keep secret in state after save
      load();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't save the payment provider.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="card anim-rise p-5">
        <h3 className="font-display text-base font-extrabold">
          Online payments
        </h3>
        <p className="mt-0.5 text-xs text-ink-400">
          Bring your own Paystack keys. The secret key is encrypted at rest and
          never returned in full.
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-cream-200 px-4 py-3">
          <span
            className={cls(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              configured
                ? "bg-leaf-100 text-leaf-700"
                : "bg-gold-100 text-gold-600"
            )}
          >
            <Icon name={configured ? "check" : "key"} size={18} />
          </span>
          <div>
            <p className="text-sm font-extrabold">
              {configured
                ? "Paystack connected"
                : "No provider connected yet"}
            </p>
            <p className="text-xs text-ink-400">
              {configured
                ? status?.secretKeyMasked
                  ? `Secret: ${status.secretKeyMasked}`
                  : "Storefront checkout accepts online payment."
                : "Add your Paystack keys to accept card payments online."}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 space-y-3">
            <div className="skeleton h-10" />
            <div className="skeleton h-10" />
          </div>
        ) : error ? (
          <p className="mt-4 text-sm font-semibold text-danger-500">{error}</p>
        ) : (
          <div className="mt-5 space-y-4">
            <Field label="Public key">
              <Input
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="pk_live_… or pk_test_…"
                className="font-mono text-xs"
              />
            </Field>
            <Field
              label="Secret key"
              hint={
                configured
                  ? "Enter a new secret to replace the current one."
                  : "From Paystack → Settings → API keys."
              }
            >
              <Input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_live_… or sk_test_…"
                className="font-mono text-xs"
              />
            </Field>
            <Button loading={saving} onClick={save} icon="check">
              Save keys
            </Button>
          </div>
        )}
      </div>

      <div className="card anim-rise self-start overflow-hidden">
        <div className="border-b border-cream-200 px-5 py-3.5">
          <h3 className="font-display text-base font-extrabold">
            Settlements
          </h3>
          <p className="text-xs text-ink-400">
            Live from Paystack for paid orders
          </p>
        </div>
        {settlements.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm font-semibold text-ink-400">
            Paid online orders appear here with their settlement status.
          </p>
        ) : (
          <div className="overflow-x-auto scrollbar-slim">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Paid</th>
                  <th className="text-right">Amount</th>
                  <th>Txn</th>
                  <th>Settlement</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s.orderId || s.reference}>
                    <td className="font-mono text-xs font-bold">
                      {s.reference || "—"}
                    </td>
                    <td className="whitespace-nowrap text-ink-500">
                      {fd(s.paidAt)}
                    </td>
                    <td className="text-right">
                      <Money
                        v={s.total}
                        currency={s.currency || "NGN"}
                        strong
                      />
                    </td>
                    <td>
                      <StatusBadge status={s.transactionStatus || "unknown"} />
                    </td>
                    <td>
                      {s.settlement?.status === "SETTLED" ? (
                        <Badge tone="green">Settled</Badge>
                      ) : (
                        <span
                          className="text-xs text-ink-400"
                          title={s.settlement?.detail}
                        >
                          Unavailable
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}