import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHead, Select } from "../../components/ui";
import { ago, cls, titleCase } from "../../lib/format";
import { ListShell, Pager, Pill, TableWrap } from "../components/bits";
import { useAdmin } from "../AdminContext";
import { usePaged } from "../lib/hooks";
import { normTicket, TICKET_PRIORITIES, TICKET_STATUSES } from "../lib/tickets";

export default function Tickets() {
  const { p, me } = useAdmin();
  const nav = useNavigate();
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [mine, setMine] = useState(false);

  // Server sorts active statuses first, then oldest first.
  const list = usePaged<any>("/api/admin/tickets", {
    status: status || undefined,
    priority: priority || undefined,
    assignedAdminId: mine ? me?.id : undefined,
    limit: 25,
  });
  const rows = list.items.map(normTicket);

  return (
    <>
      <PageHead title="Support tickets" sub="Active tickets first, oldest first." />

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {["", ...TICKET_STATUSES].map((s) => (
          <button key={s || "all"} className={cls("chip", status === s && "chip-on")} onClick={() => setStatus(s)}>
            {s ? titleCase(s) : "All"}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-cream-300" />
        <button className={cls("chip", mine && "chip-on")} onClick={() => setMine((m) => !m)}>
          Assigned to me
        </button>
        <Select className="w-36" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority">
          <option value="">Any priority</option>
          {TICKET_PRIORITIES.map((x) => (
            <option key={x} value={x}>
              {titleCase(x)}
            </option>
          ))}
        </Select>
      </div>

      <div className="card overflow-hidden">
        <ListShell
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          count={rows.length}
          emptyIcon="lifebuoy"
          emptyTitle="No tickets"
          emptyHint="Nothing matches these filters."
        >
          <TableWrap>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Store</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="cursor-pointer" onClick={() => nav(p(`/tickets/${t.id}`))}>
                  <td className="max-w-[320px] truncate font-bold text-ink-900">{t.subject}</td>
                  <td className="text-ink-600">{t.storeName ?? "—"}</td>
                  <td>
                    <Pill value={t.priority} />
                  </td>
                  <td>
                    <Pill value={t.status} />
                  </td>
                  <td className="text-xs text-ink-500">{t.assigneeLabel ?? <span className="text-ink-300">Unassigned</span>}</td>
                  <td className="whitespace-nowrap text-ink-500">{ago(t.lastMessageAt)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pager hasMore={list.hasMore} loading={list.loadingMore} onMore={list.loadMore} shown={rows.length} />
        </ListShell>
      </div>
    </>
  );
}