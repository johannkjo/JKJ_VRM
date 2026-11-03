import Link from "next/link";
import { notFound } from "next/navigation";
import Activities from "@/components/Activities";
import { ConfirmSubmit, Submit } from "@/components/Buttons";
import Tasks from "@/components/Tasks";
import Documents from "@/components/Documents";
import { ownerScope, requireUser } from "@/lib/auth";
import { DEAL_STAGES, LISTING, OFFER_STATUS, label } from "@/lib/constants";
import { db } from "@/lib/db";
import { commission } from "@/lib/deals";
import { date, dateTime, kr } from "@/lib/format";
import { addChecklistItem, addOffer, deleteDeal, moveDeal, setOfferStatus, toggleChecklist } from "../../_actions/deals";

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireUser();
  const { id } = await params;
  const d = await db.deal.findFirst({
    where: { id, ...ownerScope(s, "agentId") },
    include: {
      property: true,
      buyer: true,
      seller: true,
      checklist: { orderBy: { order: "asc" } },
      offers: { include: { bidder: true }, orderBy: { createdAt: "desc" } },
      activities: { orderBy: { occurredAt: "desc" }, include: { user: { select: { name: true } } } },
      tasks: { orderBy: [{ done: "asc" }, { dueAt: "asc" }] },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!d) notFound();
  const contacts = await db.contact.findMany({ where: ownerScope(s, "ownerId"), select: { id: true, name: true }, orderBy: { name: "asc" } });
  const back = `/solur/${id}`;
  const doneCount = d.checklist.filter((c) => c.done).length;
  const pct = d.checklist.length ? Math.round((doneCount / d.checklist.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/solur" className="muted">← Sölur</Link>
          <h1 className="h1">{d.title}</h1>
          <p className="muted">{label(LISTING, d.listing)} · {label(DEAL_STAGES, d.stage)}</p>
        </div>
        <Link href={`${back}/breyta`} className="btn-secondary">Breyta</Link>
      </div>

      <div className="flex flex-wrap gap-1">
        {Object.entries(DEAL_STAGES).map(([k, v]) => (
          <form key={k} action={moveDeal.bind(null, id, k)}>
            <button className={`rounded-full px-3 py-1 text-xs ${d.stage === k ? "bg-brand-500 text-white" : k === "LOST" ? "bg-red-50 text-red-700" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>{v}</button>
          </form>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <section className="card space-y-1 text-sm">
            <h2 className="h2">Yfirlit</h2>
            <p><span className="text-slate-500">Eign:</span> {d.property ? <Link className="link" href={`/eignir/${d.property.id}`}>{d.property.address}</Link> : "—"}</p>
            <p><span className="text-slate-500">Seljandi:</span> {d.seller ? <Link className="link" href={`/tengilidir/${d.seller.id}`}>{d.seller.name}</Link> : "—"}</p>
            <p><span className="text-slate-500">Kaupandi:</span> {d.buyer ? <Link className="link" href={`/tengilidir/${d.buyer.id}`}>{d.buyer.name}</Link> : "—"}</p>
            <p><span className="text-slate-500">Verð:</span> {kr(d.value)}</p>
            <p><span className="text-slate-500">Þóknun:</span> {kr(commission(d))}{d.commissionPct ? ` (${d.commissionPct}%)` : ""}</p>
            <p><span className="text-slate-500">Áætluð lok:</span> {date(d.expectedClose)}</p>
            {d.notes && <p className="whitespace-pre-wrap pt-2">{d.notes}</p>}
          </section>

          {d.listing === "RENT" && (d.leaseStart || d.leaseEnd || d.leaseMonthlyRent) && (
            <section className="card space-y-1 text-sm">
              <h2 className="h2">Leigusamningur</h2>
              <p><span className="text-slate-500">Tímabil:</span> {date(d.leaseStart)} – {date(d.leaseEnd)}</p>
              <p><span className="text-slate-500">Mánaðarleiga:</span> {kr(d.leaseMonthlyRent)}</p>
              <p><span className="text-slate-500">Vísitölutengd:</span> {d.leaseIndexed ? `Já${d.leaseIndexBase ? ` (${d.leaseIndexBase})` : ""}` : "Nei"}</p>
              <p><span className="text-slate-500">Áminning:</span> {d.leaseNoticeMonths ?? 6} mán. fyrir lok</p>
            </section>
          )}

          <section className="card">
            <h2 className="h2">Gátlisti <span className="text-sm font-normal text-slate-500">{doneCount}/{d.checklist.length}</span></h2>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-brand-500" style={{ width: `${pct}%` }} /></div>
            <ul className="space-y-1 text-sm">
              {d.checklist.map((c) => (
                <li key={c.id}>
                  <form action={toggleChecklist.bind(null, c.id)}>
                    <button className="flex w-full items-center gap-2 rounded px-1 py-1 text-left hover:bg-slate-50">
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${c.done ? "border-brand-500 bg-brand-500 text-white" : "border-slate-300"}`}>{c.done && "✓"}</span>
                      <span className={c.done ? "text-slate-400 line-through" : ""}>{c.label}</span>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
            <form action={addChecklistItem.bind(null, id)} className="mt-2 flex gap-2">
              <input name="label" className="input" placeholder="Bæta við atriði…" required />
              <Submit className="btn-secondary">+</Submit>
            </form>
          </section>

          <form action={deleteDeal.bind(null, id)}>
            <ConfirmSubmit message="Eyða þessari sölu ásamt tilboðum, gátlista og sögu?">Eyða sölu</ConfirmSubmit>
          </form>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <section className="card">
            <h2 className="h2">Tilboð</h2>
            <form action={addOffer.bind(null, id)} className="mb-3 grid gap-2 sm:grid-cols-2">
              <input name="amount" inputMode="numeric" className="input" placeholder="Upphæð (kr.) *" required />
              <select name="bidderId" className="input" defaultValue={d.buyerId ?? ""}>
                <option value="">— Tilboðsgjafi —</option>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input name="conditions" className="input" placeholder="Fyrirvarar (t.d. um fjármögnun)" />
              <label className="flex items-center gap-2 text-sm text-slate-500">
                Gildir til <input name="expiresAt" type="datetime-local" className="input" />
              </label>
              <Submit className="btn-secondary sm:col-span-2">Skrá tilboð</Submit>
            </form>
            {d.offers.length === 0 && <p className="muted">Engin tilboð skráð.</p>}
            <ul className="divide-y divide-slate-100 text-sm">
              {d.offers.map((o) => (
                <li key={o.id} className="py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{kr(o.amount)}</span>
                    <span className="badge">{label(OFFER_STATUS, o.status)}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {o.bidder ? o.bidder.name : "Óþekktur"} · {dateTime(o.createdAt)}
                    {o.expiresAt && ` · gildir til ${dateTime(o.expiresAt)}`}
                    {o.conditions && ` · ${o.conditions}`}
                  </p>
                  {o.status === "PENDING" || o.status === "COUNTERED" ? (
                    <div className="mt-1 flex gap-1">
                      {(["ACCEPTED", "COUNTERED", "REJECTED"] as const).map((st) => (
                        <form key={st} action={setOfferStatus.bind(null, o.id, st)}>
                          <button className="rounded border border-slate-200 px-2 py-0.5 text-xs hover:bg-slate-50">{OFFER_STATUS[st]}</button>
                        </form>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
          <Tasks items={d.tasks} links={{ dealId: id }} back={back} />
          <Documents items={d.documents} links={{ dealId: id }} back={back} title="Skjöl (samningar, tilboð, vottorð)" />
          <Activities items={d.activities} links={{ dealId: id }} back={back} />
        </div>
      </div>
    </div>
  );
}
