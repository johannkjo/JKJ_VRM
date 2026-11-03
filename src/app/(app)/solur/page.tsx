import Link from "next/link";
import Kanban, { type KanbanDeal } from "@/components/Kanban";
import { ownerScope, requireUser } from "@/lib/auth";
import { DEAL_STAGES, OPEN_STAGES, label } from "@/lib/constants";
import { db } from "@/lib/db";
import { commission } from "@/lib/deals";
import { date, mkr } from "@/lib/format";

export default async function DealsPage() {
  const s = await requireUser();
  const deals = await db.deal.findMany({
    where: ownerScope(s, "agentId"),
    include: { buyer: { select: { name: true } }, seller: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const open = deals.filter((d) => (OPEN_STAGES as readonly string[]).includes(d.stage));
  const finished = deals.filter((d) => !(OPEN_STAGES as readonly string[]).includes(d.stage));
  const kanban: KanbanDeal[] = open.map((d) => ({
    id: d.id,
    title: d.title,
    stage: d.stage,
    listing: d.listing,
    value: d.value,
    commission: commission(d),
    party: d.buyer?.name ?? d.seller?.name ?? null,
    expectedClose: d.expectedClose ? date(d.expectedClose) : null,
  }));
  const pipeline = kanban.reduce((sum, d) => sum + (d.commission ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="h1">Sölur og leigur</h1>
          <p className="muted">{open.length} í ferli · áætluð þóknun {mkr(pipeline)} · dragðu spjöld milli dálka eða veldu stig</p>
        </div>
        <Link href="/solur/ny" className="btn">+ Ný sala/leiga</Link>
      </div>
      <Kanban deals={kanban} stages={OPEN_STAGES.map((k) => [k, DEAL_STAGES[k]])} />
      {finished.length > 0 && (
        <details className="card">
          <summary className="cursor-pointer font-medium">Lokið og tapað ({finished.length})</summary>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {finished.map((d) => (
              <li key={d.id} className="flex justify-between py-2">
                <Link className="link" href={`/solur/${d.id}`}>{d.title}</Link>
                <span className="text-slate-500">{label(DEAL_STAGES, d.stage)} · {mkr(d.value)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
