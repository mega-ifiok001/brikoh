import { useState } from "react";
import { Badge, Button, Confirm, KV, Modal, PageHead, toast } from "../../components/ui";
import { Panel, SecretBox } from "../components/bits";
import { useAdmin } from "../AdminContext";
import { adminApi, errMsg } from "../lib/adminApi";

interface Rotated {
  secret: string;
  otpauthUrl: string;
  provisioningNotice?: string;
}

export default function Account() {
  const { me, isSuper, signOut } = useAdmin();
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Rotated | null>(null);

  async function rotate() {
    setBusy(true);
    try {
      const r = await adminApi.post<Rotated>("/api/admin/auth/2fa/rotate", {});
      setDone(r);
      setAsk(false);
    } catch (e) {
      toast.error(errMsg(e));
      setAsk(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead title="My account" sub="Your admin identity, role and two-factor secret." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Profile">
          <div className="-my-2 divide-y divide-cream-100">
            <KV label="Email" value={me?.email} />
            <KV label="Role" value={<Badge tone={isSuper ? "dark" : "brand"}>{me?.roleName.replace("_", " ")}</Badge>} />
            <KV label="Admin ID" value={<code className="text-xs">{me?.id}</code>} />
          </div>
        </Panel>

        <Panel title="Two-factor authentication" sub="Rotating issues a new secret and signs you out everywhere.">
          <p className="mb-3 text-sm text-ink-500">
            Every admin login requires a current 6-digit code. Rotate your secret if your authenticator may be
            compromised.
          </p>
          <Button variant="outline" icon="key" onClick={() => setAsk(true)}>
            Rotate my 2FA secret
          </Button>
        </Panel>

        <Panel title="Permissions" className="lg:col-span-2">
          {isSuper ? (
            <p className="text-sm text-ink-500">SUPER ADMIN — full access to every permission key.</p>
          ) : (me?.permissions.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-400">No permissions assigned.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {me?.permissions.map((p) => (
                <code key={p} className="rounded-md border border-cream-200 bg-cream-50 px-2 py-1 text-xs font-semibold">
                  {p}
                </code>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Confirm
        open={ask}
        onClose={() => setAsk(false)}
        loading={busy}
        onConfirm={rotate}
        title="Rotate your 2FA secret?"
        confirmLabel="Rotate secret"
        body="The current secret stops working immediately. You'll see the new one once, and all your sessions (including this one) will need to sign in again."
      />

      <Modal
        open={!!done}
        onClose={() => {}}
        title="Your new 2FA secret"
        footer={
          <Button
            onClick={async () => {
              setDone(null);
              await signOut();
            }}
          >
            I've saved it — sign out
          </Button>
        }
      >
        {done && <SecretBox secret={done.secret} otpauthUrl={done.otpauthUrl} note={done.provisioningNotice} />}
      </Modal>
    </>
  );
}