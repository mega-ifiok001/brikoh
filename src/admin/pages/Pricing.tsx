import { useState } from "react";
import { Button, Field, Input, Modal, PageHead, toast } from "../../components/ui";
import { fm } from "../../lib/format";
import { ListShell, Panel, Pill } from "../components/bits";
import { useAdmin } from "../AdminContext";
import { adminApi, errMsg } from "../lib/adminApi";
import { useGet } from "../lib/hooks";

interface Item {
  plan: string;
  monthlyPrice: number | null;
}

export default function Pricing() {
  const { can } = useAdmin();
  const canEdit = can("billing:edit");
  const { data, loading, error, reload } = useGet<{ items: Item[] }>("/api/admin/billing/pricing");
  const [edit, setEdit] = useState<Item | null>(null);
  const [price, setPrice] = useState("");
  const [free, setFree] = useState(false);
  const [saving, setSaving] = useState(false);

  function open(i: Item) {
    setEdit(i);
    setFree(i.monthlyPrice === null);
    setPrice(i.monthlyPrice === null ? "" : String(i.monthlyPrice));
  }

  const parsed = free ? null : Number(price);
  const valid = free || (Number.isInteger(parsed) && (parsed as number) > 0);

  async function save() {
    if (!edit || !valid) return;
    setSaving(true);
    try {
      await adminApi.put(`/api/admin/billing/pricing/${edit.plan}`, { monthlyPrice: parsed });
      toast.success(`${edit.plan.toUpperCase()} price updated`);
      setEdit(null);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHead title="Plan pricing" sub="Prices live in the database, not in code. MRR is computed from these values." />

      <ListShell loading={loading} error={error} onRetry={reload} count={data?.items.length ?? 0} emptyIcon="tag">
        <div className="grid gap-4 md:grid-cols-3">
          {data?.items.map((i) => (
            <Panel key={i.plan}>
              <div className="flex items-center justify-between">
                <Pill value={i.plan} />
                {canEdit && (
                  <Button size="sm" variant="outline" icon="edit" onClick={() => open(i)}>
                    Edit
                  </Button>
                )}
              </div>
              <p className="mt-4 font-display text-3xl font-extrabold tabular-nums">
                {i.monthlyPrice === null ? "Free" : fm(i.monthlyPrice, "NGN")}
              </p>
              <p className="mt-0.5 text-xs text-ink-400">
                {i.monthlyPrice === null ? "Excluded from MRR" : "per month, NGN"}
              </p>
            </Panel>
          ))}
        </div>
      </ListShell>

      {!canEdit && !loading && (
        <p className="mt-4 text-xs text-ink-400">Read-only: your role doesn't include <code>billing:edit</code>.</p>
      )}

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={`Edit ${edit?.plan.toUpperCase()} price`}
        sub="Takes effect for MRR immediately. The change is written to the audit log."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button loading={saving} disabled={!valid} onClick={save}>
              Save price
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="flex items-center gap-2.5 text-sm font-semibold text-ink-700">
            <input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} className="h-4 w-4 accent-brand-500" />
            Free / excluded from MRR
          </label>
          <Field
            label="Monthly price (NGN)"
            hint="Positive whole number."
            error={!free && price && !valid ? "Enter a positive whole number." : undefined}
          >
            <Input
              inputMode="numeric"
              disabled={free}
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="e.g. 4900"
            />
          </Field>
          <p className="rounded-lg bg-cream-100 px-3 py-2 text-sm text-ink-600">
            {edit?.monthlyPrice === null ? "Free" : fm(edit?.monthlyPrice, "NGN")} →{" "}
            <b>{free ? "Free" : valid ? fm(parsed, "NGN") : "—"}</b>
          </p>
        </div>
      </Modal>
    </>
  );
}