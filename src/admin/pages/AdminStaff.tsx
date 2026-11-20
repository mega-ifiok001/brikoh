import { useState } from "react";
import { Badge, Button, Confirm, Modal, PageHead, toast } from "../../components/ui";
import { ago, fd } from "../../lib/format";
import { ListShell, Pill, SecretBox, TableWrap } from "../components/bits";
import { useAdmin } from "../AdminContext";
import { adminApi, errMsg } from "../lib/adminApi";
import { useGet } from "../lib/hooks";

interface Staff {
  id: string;
  email: string;
  roleName: string;
  isActive: boolean;
  createdAt: string;
  session: { ipAddress: string | null; userAgent: string | null; createdAt: string } | null;
}

interface Reset {
  email: string;
  secret: string;
  otpauthUrl: string;
}

export default function AdminStaff() {
  const { me } = useAdmin();
  const { data, loading, error, reload } = useGet<{ items: Staff[] }>("/api/admin/staff");
  const items = data?.items ?? [];
  const [target, setTarget] = useState<Staff | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Reset | null>(null);

  async function reset() {
    if (!target) return;
    setBusy(true);
    try {
      const r = await adminApi.post<Reset>("/api/admin/auth/2fa/reset", { adminUserId: target.id });
      setDone(r);
      setTarget(null);
    } catch (e) {
      toast.error(errMsg(e));
      setTarget(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead title="Platform staff" sub="Admins and their newest usable session. Token values and TOTP secrets are never shown." />

      <div className="card overflow-hidden">
        <ListShell loading={loading} error={error} onRetry={reload} count={items.length} emptyIcon="shield" emptyTitle="No admins">
          <TableWrap>
            <thead>
              <tr>
                <th>Admin</th>
                <th>Role</th>
                <th>Status</th>
                <th>Current session</th>
                <th>Added</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td className="font-semibold">
                    {a.email}
                    {a.id === me?.id && <span className="ml-2 text-xs font-bold text-brand-600">you</span>}
                  </td>
                  <td>
                    <Pill value={a.roleName} tone={a.roleName === "SUPER_ADMIN" ? "dark" : "brand"} />
                  </td>
                  <td>{a.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="muted">Disabled</Badge>}</td>
                  <td className="text-xs text-ink-500">
                    {a.session ? (
                      <>
                        <div className="font-semibold text-ink-700">
                          {a.session.ipAddress ?? "unknown IP"} · signed in {ago(a.session.createdAt)}
                        </div>
                        <div className="max-w-[300px] truncate text-ink-400" title={a.session.userAgent ?? ""}>
                          {a.session.userAgent ?? "unknown device"}
                        </div>
                      </>
                    ) : (
                      <span className="text-ink-300">No active session</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-ink-500">{fd(a.createdAt)}</td>
                  <td className="text-right">
                    {a.id !== me?.id && (
                      <Button size="sm" variant="outline" icon="key" onClick={() => setTarget(a)}>
                        Reset 2FA
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </ListShell>
      </div>

      <Confirm
        open={!!target}
        onClose={() => setTarget(null)}
        loading={busy}
        onConfirm={reset}
        title={`Reset 2FA for ${target?.email}?`}
        confirmLabel="Reset 2FA"
        body="Break-glass recovery. A new secret is generated and shown once to you; all of this admin's refresh tokens are revoked, so each of their sessions must sign in again once its access token expires. One audit entry is recorded."
      />

      <Modal
        open={!!done}
        onClose={() => setDone(null)}
        title="New 2FA secret"
        sub={done?.email}
        footer={<Button onClick={() => setDone(null)}>I've passed it on securely</Button>}
      >
        {done && <SecretBox secret={done.secret} otpauthUrl={done.otpauthUrl} />}
      </Modal>
    </>
  );
}