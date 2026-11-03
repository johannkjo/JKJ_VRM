import Link from "next/link";
import { TaskRow } from "@/components/Tasks";
import { ownerScope, requireUser } from "@/lib/auth";
import { CONTACT_ROLES, DEAL_STAGES, OPEN_STAGES, SHOWING_KINDS, label } from "@/lib/constants";
import { db } from "@/lib/db";
import { commission } from "@/lib/deals";
import { date, dateTime, mkr } from "@/lib/format";
import { matchProperty } from "@/lib/matching";

function Stat({ label, value, href, sub }: { label: string; value: string | number; href?: string; sub?: string }) {
  const body = (
    <div className="card h-full">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
  return href ? <Link href={href} className="block hover:opacity-90">{body}</Link> : body;
}

export default async function Dashboard() {
  const s = await requireUser();
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setUTCHours(23, 59, 59, 999);
  const in7 = new Date(now.getTime() + 7 * 864e5);
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  const in12m = new Date(now.getTime() + 365 * 864e5);
  const [tasks, showings, deals, activeProps, buyers, newContacts, closedThisYear, sources, leases] = await Promise.all([
    db.task.findMany({
      where: { ...ownerScope(s, "userId"), done: false, OR: [{ dueAt: { lte: endOfToday } }, { dueAt: null }] },
      include: { contact: { select: { id: true, name: true } }, property: { select: { id: true, address: true } }, deal: { select: { id: true, title: true } } },
      orderBy: [{ priority: "asc" }, { dueAt: "asc" }],
      take: 15,
    }),
    db.showing.findMany({
      where: { startsAt: { gte: new Date(now.getTime() - 3 * 36e5), lte: in7 }, property: ownerScope(s, "agentId") },
      include: { property: { select: { address: true } } },
      orderBy: { startsAt: "asc" },
    }),
    db.deal.findMany({ where: { ...ownerScope(s, "agentId"), stage: { in: [...OPEN_STAGES] } } }),
    db.property.findMany({ where: { ...ownerScope(s, "agentId"), status: "ACTIVE" } }),
    db.contact.findMany({ where: { ...ownerScope(s, "ownerId"), searchActive: true } }),
    db.contact.count({ where: { ...ownerScope(s, "ownerId"), createdAt: { gte: new Date(now.getTime() - 30 * 864e5) } } }),
    db.deal.findMany({ where: { ...ownerScope(s, "agentId"), stage: "CLOSED", updatedAt: { gte: yearStart } } }),
    db.contact.groupBy({ by: ["source"], where: { ...ownerScope(s, "ownerId"), source: { not: null } }, _count: true, orderBy: { _count: { source: "desc" } }, take: 6 }),
    db.deal.findMany({
      where: { ...ownerScope(s, "agentId"), listing: "RENT", stage: "CLOSED", leaseEnd: { gte: now, lte: in12m } },
      orderBy: { leaseEnd: "asc" },
    }),
  ]);

  const pipelineCommission = deals.reduce((sum, d) => sum + (commission(d) ?? 0), 0);
  const earned = closedThisYear.reduce((sum, d) => sum + (commission(d) ?? 0), 0);
  const byStage = OPEN_STAGES.map((k) => ({ k, n: deals.filter((d) => d.stage === k).length }));
  const maxStage = Math.max(1, ...byStage.map((x) => x.n));

  // Heitar paranir: virkar eignir × kaupendur með ≥ 80% samsvörun
  const hot = activeProps
    .flatMap((p) => buyers.map((c) => ({ p, c, m: matchProperty(c, p) })))
    .filter((x) => x.m && x.m.score >= 80)
    .sort((a, b) => b.m!.score - a.m!.score)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">Góðan daginn, {s.name.split(" ")[0]}</h1>
        <p className="muted">{now.toLocaleDateString("is-IS", { weekday: "long", day: "numeric", month: "long", timeZone: "Atlantic/Reykjavik" })}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Eignir í sölu/leigu" value={activeProps.length} href="/eignir" />
        <Stat label="Sölur í ferli" value={deals.length} href="/solur" sub={`Áætluð þóknun ${mkr(pipelineCommission)}`} />
        <Stat label="Þóknun á árinu" value={mkr(earned)} sub={`${closedThisYear.length} lokaðar sölur`} />
        <Stat label="Kaupendur í leit" value={buyers.length} href="/tengilidir?role=BUYER" sub={`${newContacts} nýir tengiliðir sl. 30 daga`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="h2">Verkefni dagsins</h2>
            <Link href="/verkefni" className="link text-sm">Öll verkefni →</Link>
          </div>
          {tasks.length === 0 ? <p className="muted">Ekkert á dagskrá í dag 🎉</p> : (
            <ul className="divide-y divide-slate-100">{tasks.map((t) => <TaskRow key={t.id} t={t} back="/" showLinks />)}</ul>
          )}
        </section>

        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="h2">Næstu sýningar</h2>
            <Link href="/dagatal" className="link text-sm">Dagatal →</Link>
          </div>
          {showings.length === 0 && <p className="muted">Engar sýningar næstu 7 daga.</p>}
          <ul className="space-y-2 text-sm">
            {showings.map((sh) => (
              <li key={sh.id}>
                <Link href={`/opid-hus/${sh.id}`} className="block rounded-lg p-2 hover:bg-slate-50">
                  <p className="font-medium">{sh.property.address}</p>
                  <p className="text-xs text-slate-500">{label(SHOWING_KINDS, sh.kind)} · {dateTime(sh.startsAt)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card">
          <h2 className="h2">Söluferli</h2>
          <ul className="space-y-2 text-sm">
            {byStage.map(({ k, n }) => (
              <li key={k} className="grid grid-cols-[7.5rem_1fr_1.5rem] items-center gap-2">
                <span className="text-slate-600">{label(DEAL_STAGES, k)}</span>
                <div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${(n / maxStage) * 100}%` }} /></div>
                <span className="text-right tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 className="h2">🔥 Heitar paranir</h2>
          {hot.length === 0 && <p className="muted">Engar sterkar paranir núna. Fylltu út leitarprófíla hjá kaupendum.</p>}
          <ul className="space-y-2 text-sm">
            {hot.map(({ p, c, m }) => (
              <li key={`${p.id}-${c.id}`}>
                <Link href={`/tengilidir/${c.id}`} className="link">{c.name}</Link> ↔ <Link href={`/eignir/${p.id}`} className="link">{p.address}</Link>
                <span className="ml-1 text-xs text-slate-500">{m!.score}%</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 className="h2">Hvaðan koma viðskiptavinir?</h2>
          {sources.length === 0 && <p className="muted">Skráðu „uppruna“ á tengiliði til að sjá yfirlit.</p>}
          <ul className="space-y-1 text-sm">
            {sources.map((x) => (
              <li key={x.source} className="flex justify-between"><span>{x.source}</span><span className="tabular-nums text-slate-500">{x._count}</span></li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-400">Hlutverk: {Object.values(CONTACT_ROLES).join(", ")}</p>
        </section>
      </div>

        {leases.length > 0 && (
          <section className="card">
            <h2 className="h2">Leigusamningar sem renna út á næstu 12 mánuðum</h2>
            <ul className="divide-y divide-slate-100 text-sm">
              {leases.map((d) => {
                const months = Math.round((d.leaseEnd!.getTime() - now.getTime()) / (30.4 * 864e5));
                return (
                  <li key={d.id} className="flex flex-wrap justify-between gap-2 py-2">
                    <Link href={`/solur/${d.id}`} className="link">{d.title}</Link>
                    <span className={months <= (d.leaseNoticeMonths ?? 6) ? "font-medium text-red-600" : "text-slate-500"}>
                      {date(d.leaseEnd)} · eftir {months} mán.{d.leaseIndexed ? " · vísitölutengd" : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
    </div>
  );
}
