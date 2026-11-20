import { useState } from "react";
import { Button, Confirm, Field, Input, Modal, PageHead, Select, Textarea, toast } from "../../components/ui";
import { fdt, titleCase } from "../../lib/format";
import { ListShell, Pager, Pill } from "../components/bits";
import { adminApi, errMsg } from "../lib/adminApi";
import { usePaged } from "../lib/hooks";

interface Ann {
  id: string;
  title: string;
  body: string;
  targetTier: string | null;
  publishedAt: string | null;
  isActive?: boolean;
  createdAt: string;
}

const stateOf = (a: Ann) => (!a.publishedAt ? "DRAFT" : a.isActive === false ? "HIDDEN" : "LIVE");

export default function Announcements() {
  const list = usePaged<Ann>("/api/admin/announcements", { limit: 50 });
  const [editing, setEditing] = useState<Partial<Ann> | null>(null); // {} = new
  const [saving, setSaving] = useState(false);
  const [publish, setPublish] = useState<Ann | null>(null);
  const [hide, setHide] = useState<Ann | null>(null);
  const [busy, setBusy] = useState(false);
  const [views, setViews] = useState<Record<string, number | "…">>({});

  const isNew = !!editing && !editing.id;

  async function save() {
    if (!editing) return;
    const title = (editing.title ?? "").trim();
    const body = (editing.body ?? "").trim();
    if (!title || !body) return toast.error("Title and message are both required.");
    setSaving(true);
    try {
      const payload = { title, body, targetTier: editing.targetTier || null };
      if (isNew) await adminApi.post("/api/admin/announcements", payload);
      else await adminApi.patch(`/api/admin/announcements/${editing.id}`, payload);
      toast.success(isNew ? "Draft created" : "Draft updated");
      setEditing(null);
      list.reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  }

  async function patch(a: Ann, body: object, ok: string, done: () => void) {
    setBusy(true);
    try {
      await adminApi.patch(`/api/admin/announcements/${a.id}`, body);
      toast.success(ok);
      done();
      list.reload();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function loadViews(a: Ann) {
    setViews((v) => ({ ...v, [a.id]: "…" }));
    try {
      const r = await adminApi.get<{ viewCount: number }>(`/api/admin/announcements/${a.id}/views`);
      setViews((v) => ({ ...v, [a.id]: r.viewCount }));
    } catch (e) {
      setViews((v) => {
        const { [a.id]: _drop, ...rest } = v;
        return rest;
      });
      toast.error(errMsg(e));
    }
  }

  return (
    <>
      <PageHead title="Announcements" sub="Drafts are private. Publishing is permanent — a live announcement can only be hidden.">
        <Button icon="plus" onClick={() => setEditing({ targetTier: null })}>
          New announcement
        </Button>
      </PageHead>

      <ListShell
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        count={list.items.length}
        emptyIcon="bell"
        emptyTitle="No announcements yet"
        emptyHint="Create a draft, then publish it to show it to merchants."
      >
        <div className="space-y-3">
          {list.items.map((a) => {
            const st = stateOf(a);
            const v = views[a.id];
            return (
              <div key={a.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold">{a.title}</h3>
                      <Pill value={st} />
                      <Pill value={a.targetTier ? a.targetTier : "All tiers"} tone="muted" />
                    </div>
                    <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-sm text-ink-500">{a.body}</p>
                    <p className="mt-2 text-xs text-ink-400">
                      Created {fdt(a.createdAt)}
                      {a.publishedAt && <> · Published {fdt(a.publishedAt)}</>}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {a.publishedAt && (
                      <Button size="sm" variant="outline" icon="eye" onClick={() => loadViews(a)} loading={v === "…"}>
                        {typeof v === "number" ? `${v.toLocaleString("en")} stores viewed` : "View count"}
                      </Button>
                    )}
                    {st === "DRAFT" && (
                      <>
                        <Button size="sm" variant="outline" icon="edit" onClick={() => setEditing(a)}>
                          Edit
                        </Button>
                        <Button size="sm" icon="send" onClick={() => setPublish(a)}>
                          Publish
                        </Button>
                      </>
                    )}
                    {st === "LIVE" && (
                      <Button size="sm" variant="outline" onClick={() => setHide(a)}>
                        Hide
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <Pager hasMore={list.hasMore} loading={list.loadingMore} onMore={list.loadMore} shown={list.items.length} />
        </div>
      </ListShell>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={isNew ? "New announcement" : "Edit draft"}
        sub="Saved as a draft — nothing is shown to merchants until you publish."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={save}>
              {isNew ? "Create draft" : "Save changes"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title">
            <Input
              value={editing?.title ?? ""}
              onChange={(e) => setEditing((x) => ({ ...x, title: e.target.value }))}
              maxLength={140}
            />
          </Field>
          <Field label="Message">
            <Textarea
              rows={6}
              value={editing?.body ?? ""}
              onChange={(e) => setEditing((x) => ({ ...x, body: e.target.value }))}
            />
          </Field>
          <Field label="Audience" hint="Limit to one plan tier, or show to everyone.">
            <Select
              value={editing?.targetTier ?? ""}
              onChange={(e) => setEditing((x) => ({ ...x, targetTier: e.target.value || null }))}
            >
              <option value="">All tiers</option>
              {["STARTER", "PRO", "ENTERPRISE"].map((t) => (
                <option key={t} value={t}>
                  {titleCase(t)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>

      <Confirm
        open={!!publish}
        onClose={() => setPublish(null)}
        loading={busy}
        title="Publish this announcement?"
        confirmLabel="Publish now"
        body={`"${publish?.title}" goes live for ${publish?.targetTier ? titleCase(publish.targetTier) + " stores" : "all stores"} immediately. It can't be unpublished — only hidden.`}
        onConfirm={() =>
          publish && patch(publish, { publishedAt: new Date().toISOString() }, "Announcement published", () => setPublish(null))
        }
      />
      <Confirm
        open={!!hide}
        onClose={() => setHide(null)}
        loading={busy}
        title="Hide this announcement?"
        confirmLabel="Hide"
        body="It disappears for merchants immediately. This can't be undone from the panel."
        onConfirm={() => hide && patch(hide, { isActive: false }, "Announcement hidden", () => setHide(null))}
      />
    </>
  );
}