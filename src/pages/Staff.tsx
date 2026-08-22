import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { asList, fd, titleCase } from "../lib/format";
import {
  Badge,
  Button,
  Confirm,
  EmptyState,
  ErrorState,
  Field,
  IconBtn,
  Input,
  Select,
  toast,
} from "../components/ui";

const ROLES = [
  { id: "ADMIN", label: "Admin", hint: "Full access to everything" },
  { id: "MANAGER", label: "Manager", hint: "Runs the day-to-day" },
  { id: "STAFF", label: "Staff", hint: "Sales and stock only" },
] as const;

export default function Staff() {
  const { me } = useAuth();
  const myEmail = (me.account as any)?.email || "";

  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("STAFF");
  const [invBusy, setInvBusy] = useState(false);

  const [roleBusy, setRoleBusy] = useState<string | null>(null);
  const [removeFor, setRemoveFor] = useState<any | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  // ---------- Load ----------
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/api/dashboard/staff");
      setMembers(asList(res, "items", "staff", "staffMembers", "data"));
    } catch (e: any) {
      if (e?.status === 403 || e?.code === "INSUFFICIENT_PERMISSIONS") {
        setError(
          "Only the store owner can manage staff. Staff accounts cannot open this page."
        );
      } else {
        setError(e?.message || "Couldn't load the team.");
      }
      setMembers([]);
    }

    try {
      const res = await api.get("/api/dashboard/staff/invites");
      setInvites(asList(res, "items", "invites", "data"));
    } catch {
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---------- Helpers ----------
  const emailOf = (m: any) => {
  if (!m) return "";
  return m.email || m.account?.email || "";
};

  // ---------- Invite ----------
  const sendInvite = async () => {
    const email = invEmail.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Enter a valid email for the invite.");
      return;
    }
    setInvBusy(true);
    try {
      await api.post("/api/dashboard/staff/invites", {
        email,
        role: invRole,
      });
      toast.success(`Invite sent to ${email}.`);
      setInvEmail("");
      load();
    } catch (e: any) {
      const msg =
        e?.code === "EMAIL_TAKEN"
          ? "That email already belongs to an account."
          : e?.code === "ALREADY_STAFF"
          ? "That person is already on your team."
          : e?.code === "STAFF_LIMIT_REACHED"
          ? "You've reached your staff limit for this plan."
          : e?.message || "Couldn't send the invite.";
      toast.error(msg);
    } finally {
      setInvBusy(false);
    }
  };

  const revokeInvite = async (inv: any) => {
    try {
      await api.del(`/api/dashboard/staff/invites/${inv.id}`);
      toast.success("Invite revoked.");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't revoke the invite.");
    }
  };

  // ---------- Role / active (PATCH) ----------
  const changeRole = async (m: any, role: string) => {
    setRoleBusy(m.id);
    try {
      await api.patch(`/api/dashboard/staff/${m.id}`, { role });
      toast.success(
        `${emailOf(m)} is now ${ROLES.find((r) => r.id === role)?.label}.`
      );
      load();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't change the role.");
    } finally {
      setRoleBusy(null);
    }
  };

  const toggleActive = async (m: any) => {
    const next = m.isActive === false; // if currently inactive → activate
    try {
      await api.patch(`/api/dashboard/staff/${m.id}`, { isActive: next });
      toast.success(
        next
          ? `${emailOf(m)} can sign in again.`
          : `${emailOf(m)} is deactivated.`
      );
      load();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't update the member.");
    }
  };

  // ---------- Remove ----------
  const confirmRemove = async () => {
    if (!removeFor) return;
    setRemoveBusy(true);
    try {
      await api.del(`/api/dashboard/staff/${removeFor.id}`);
      toast.success("Member removed from the team.");
      setRemoveFor(null);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Couldn't remove the member.");
    } finally {
      setRemoveBusy(false);
    }
  };

  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* ---------- Members ---------- */}
        <div>
          <div className="mb-4">
            <h2 className="font-display text-lg font-extrabold">Team</h2>
            <p className="text-sm text-ink-400">
              Who can sign in and what they can touch.
            </p>
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
          ) : members.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="user"
                title="Just you so far"
                hint="Invite a colleague to help with sales, stock or money — each with their own role."
              />
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto scrollbar-slim">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => {
                      const mine = isMe(m);
                      return (
                        <tr key={m.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-xs font-extrabold text-white">
                                {(emailOf(m)[0] || "?").toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-bold">
                                  {emailOf(m)}
                                  {mine && (
                                    <span className="ml-1 text-xs text-brand-600">
                                      (you)
                                    </span>
                                  )}
                                </p>
                                {Array.isArray(m.permissions) &&
                                  m.permissions.length > 0 && (
                                    <p className="truncate text-[11px] text-ink-400">
                                      {m.permissions.includes("all")
                                        ? "All permissions"
                                        : m.permissions.slice(0, 3).join(", ") +
                                          (m.permissions.length > 3
                                            ? "…"
                                            : "")}
                                    </p>
                                  )}
                              </div>
                            </div>
                          </td>
                          <td>
                            {mine ? (
                              <Badge tone="dark">Owner</Badge>
                            ) : (
                              <select
                                className="inp !w-auto !py-1 text-xs font-bold"
                                value={m.role || "STAFF"}
                                disabled={roleBusy === m.id}
                                onChange={(e) =>
                                  changeRole(m, e.target.value)
                                }
                              >
                                {ROLES.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="whitespace-nowrap text-ink-500">
                            {fd(m.createdAt)}
                          </td>
                          <td>
                            <Badge
                              tone={
                                m.isActive !== false ? "green" : "neutral"
                              }
                            >
                              {m.isActive !== false
                                ? "Active"
                                : "Deactivated"}
                            </Badge>
                          </td>
                          <td>
                            {mine ? (
                              <span className="text-xs text-ink-300">—</span>
                            ) : (
                              <div className="flex justify-end gap-0.5">
                                <IconBtn
                                  name={
                                    m.isActive !== false ? "eye" : "refresh"
                                  }
                                  label={
                                    m.isActive !== false
                                      ? "Deactivate"
                                      : "Re-activate"
                                  }
                                  onClick={() => toggleActive(m)}
                                />
                                <IconBtn
                                  name="trash"
                                  label="Remove"
                                  className="hover:bg-danger-100 hover:text-danger-500"
                                  onClick={() => setRemoveFor(m)}
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ---------- Invites ---------- */}
        <div className="space-y-5">
          <div className="card anim-rise p-5">
            <h3 className="font-display text-base font-extrabold">
              Invite someone
            </h3>
            <p className="mt-0.5 text-xs text-ink-400">
              They’ll get an email with a link to join your store.
            </p>
            <div className="mt-4 space-y-3">
              <Field label="Email">
                <Input
                  value={invEmail}
                  onChange={(e) => setInvEmail(e.target.value)}
                  type="email"
                  placeholder="colleague@email.com"
                />
              </Field>
              <Field label="Role">
                <Select
                  value={invRole}
                  onChange={(e) => setInvRole(e.target.value)}
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label} — {r.hint}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button
                className="w-full"
                loading={invBusy}
                icon="send"
                onClick={sendInvite}
              >
                Send invite
              </Button>
            </div>
          </div>

          {invites.length > 0 && (
            <div className="card anim-rise overflow-hidden">
              <div className="border-b border-cream-200 px-5 py-3.5">
                <h3 className="font-display text-base font-extrabold">
                  Pending invites
                </h3>
                <p className="text-xs text-ink-400">
                  The invite link is only in the email — it is never shown
                  here.
                </p>
              </div>
              {invites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-2 border-b border-cream-100 px-5 py-3.5 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{inv.email}</p>
                    <p className="text-xs text-ink-400">
                      {titleCase(inv.role || "STAFF")} · expires{" "}
                      {fd(inv.expiresAt)}
                    </p>
                  </div>
                  <IconBtn
                    name="x"
                    label="Revoke"
                    onClick={() => revokeInvite(inv)}
                    className="hover:bg-danger-100 hover:text-danger-500"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Confirm
        open={!!removeFor}
        onClose={() => setRemoveFor(null)}
        onConfirm={confirmRemove}
        loading={removeBusy}
        title={`Remove ${emailOf(removeFor)}?`}
        body="They’ll lose access immediately. Their sales history and stock movements stay in the records."
        confirmLabel="Remove member"
      />
    </div>
  );
}