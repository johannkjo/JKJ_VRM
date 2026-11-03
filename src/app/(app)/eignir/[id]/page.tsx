import Link from "next/link";
import { notFound } from "next/navigation";
import Activities from "@/components/Activities";
import { ConfirmSubmit, Submit } from "@/components/Buttons";
import ClaudeButton from "@/components/ClaudeButton";
import Documents from "@/components/Documents";
import Tasks from "@/components/Tasks";
import { ownerScope, requireUser } from "@/lib/auth";
import { AD_STATUS, DEAL_STAGES, LISTING, PROPERTY_STATUS, PROPERTY_TYPES, SHOWING_KINDS, label } from "@/lib/constants";
import { db } from "@/lib/db";
import { date, dateTime, kr, num } from "@/lib/format";
import { matchProperty, rankMatches } from "@/lib/matching";
import { deleteProperty, generateDescription, publishAd, setPropertyStatus } from "../../_actions/properties";
import { createShowing } from "../../_actions/showings";

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireUser();
  const { id } = await params;
  const p = await db.property.findFirst({
    where: { id, ...ownerScope(s, "agentId") },
    include: {
      seller: true,
      deals: true,
      showings: { orderBy: { startsAt: "desc" }, include: { _count: { select: { attendees: true } } } },
      activities: { orderBy: { occurredAt: "desc" }, include: { user: { select: { name: true } } } },
      tasks: { orderBy: [{ done: "asc" }, { dueAt: "asc" }] },
      documents: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!p) notFound();

  const buyers = await db.contact.findMany({ where: { searchActive: true, ...ownerScope(s, "ownerId") } });
  const matches = rankMatches(buyers.map((c) => ({ item: c, match: matchProperty(c, p) })));
  const back = `/eignir/${id}`;
  const pricePerSqm = p.price && p.size && p.listing === "SALE" ? Math.round(p.price / p.size) : null;
  const emails = matches.map((m) => m.item.email).filter(Boolean).join(",");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="h1">{p.address}</h1>
          <p className="muted">{p.postcode} {p.city} · {label(PROPERTY_TYPES, p.type)} · {label(LISTING, p.listing)}{p.fastanumer && ` · Fastanr. ${p.fastanumer}`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/solur/ny?propertyId=${id}`} className="btn-secondary">+ Stofna sölu</Link>
          <Link href={`${back}/breyta`} className="btn-secondary">Breyta</Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <section className="card text-sm">
            <p className="text-2xl font-semibold">{kr(p.price)}{p.listing === "RENT" && <span className="text-sm font-normal text-slate-500"> /mán.</span>}</p>
            {pricePerSqm && <p className="text-slate-500">{kr(pricePerSqm)} á m²</p>}
            <dl className="mt-3 grid grid-cols-2 gap-y-1">
              <dt className="text-slate-500">Stærð</dt><dd>{num(p.size)} m²</dd>
              <dt className="text-slate-500">Herbergi</dt><dd>{num(p.rooms)}</dd>
              <dt className="text-slate-500">Svefnherb.</dt><dd>{num(p.bedrooms)}</dd>
              <dt className="text-slate-500">Baðherb.</dt><dd>{num(p.bathrooms)}</dd>
              <dt className="text-slate-500">Byggt</dt><dd>{p.yearBuilt ?? "—"}</dd>
              <dt className="text-slate-500">Fasteignamat</dt><dd>{kr(p.fasteignamat)}</dd>
              <dt className="text-slate-500">Brunabótamat</dt><dd>{kr(p.brunabotamat)}</dd>
              <dt className="text-slate-500">Bílskúr / lyfta</dt><dd>{p.garage ? "Já" : "Nei"} / {p.elevator ? "Já" : "Nei"}</dd>
            </dl>
          </section>

          <section className="card text-sm">
            <h2 className="h2">Staða</h2>
            <div className="flex flex-wrap gap-1">
              {Object.entries(PROPERTY_STATUS).map(([k, v]) => (
                <form key={k} action={setPropertyStatus.bind(null, id, k)}>
                  <button className={`rounded-full px-2.5 py-1 text-xs ${p.status === k ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{v}</button>
                </form>
              ))}
            </div>
            <h2 className="h2 mt-4">Seljandi / leigusali</h2>
            {p.seller ? (
              <p>
                <Link href={`/tengilidir/${p.seller.id}`} className="link">{p.seller.name}</Link>
                {p.seller.phone && <> · <a className="link" href={`tel:${p.seller.phone}`}>{p.seller.phone}</a></>}
              </p>
            ) : <p className="muted">Ekki skráður</p>}
            {p.deals.length > 0 && (
              <>
                <h2 className="h2 mt-4">Sölur</h2>
                {p.deals.map((d) => <Link key={d.id} href={`/solur/${d.id}`} className="block link">{d.title} – {label(DEAL_STAGES, d.stage)}</Link>)}
              </>
            )}
          </section>

          <section className="card text-sm">
            <h2 className="h2">Auglýsing (auglýsing.app)</h2>
            <p>Staða: <span className="badge">{label(AD_STATUS, p.adStatus)}</span></p>
            {p.adPublishedAt && <p className="muted mt-1">Birt {date(p.adPublishedAt)}</p>}
            <form action={publishAd.bind(null, id)} className="mt-3">
              <Submit className="btn" pendingText="Sendi…">{p.adStatus === "PUBLISHED" ? "Uppfæra auglýsingu" : "Birta auglýsingu"}</Submit>
            </form>
          </section>

          <form action={deleteProperty.bind(null, id)}>
            <ConfirmSubmit message={`Eyða ${p.address}? Allar sýningar, verkefni og saga eignarinnar eyðast.`}>Eyða eign</ConfirmSubmit>
          </form>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Documents items={p.documents} links={{ propertyId: id }} back={back} title="Myndir og skjöl (söluyfirlit, eignaskiptayfirlýsing…)" />

          <section className="card">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="h2 mb-0">Eignalýsing</h2>
              <ClaudeButton action={generateDescription.bind(null, id)} hasText={Boolean(p.description)} />
            </div>
            {p.description ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{p.description}</p> : <p className="muted">Engin lýsing enn. Bættu við stikkorðum í „Breyta“ og láttu Claude skrifa drög.</p>}
          </section>

          <section className="card">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="h2 mb-0">Kaupendur/leigutakar sem passa ({matches.length})</h2>
              {emails && (
                <a className="btn-secondary" href={`mailto:?bcc=${emails}&subject=${encodeURIComponent(`Ný eign: ${p.address}`)}`}>✉️ Senda öllum</a>
              )}
            </div>
            {matches.length === 0 && <p className="muted">Enginn með virkan leitarprófíl passar við eignina.</p>}
            <ul className="divide-y divide-slate-100">
              {matches.map(({ item: c, match }) => (
                <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="w-12 rounded bg-brand-50 py-1 text-center font-semibold text-brand-700">{match.score}%</span>
                  <div className="flex-1">
                    <Link href={`/tengilidir/${c.id}`} className="link font-medium">{c.name}</Link>
                    <p className="text-xs text-slate-500">{match.reasons.join(" · ")}{match.misses.length > 0 && <span className="text-amber-600"> · {match.misses.join(" · ")}</span>}</p>
                  </div>
                  {c.phone && <a href={`tel:${c.phone}`} className="text-lg" title="Hringja">📞</a>}
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2 className="h2">Sýningar og opin hús</h2>
            <form action={createShowing} className="mb-3 flex flex-wrap gap-2">
              <input type="hidden" name="propertyId" value={id} />
              <select name="kind" className="input w-auto">
                {Object.entries(SHOWING_KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="datetime-local" name="startsAt" className="input w-auto" required />
              <input type="datetime-local" name="endsAt" className="input w-auto" title="Lok (valkvætt)" />
              <Submit className="btn-secondary">Skrá sýningu</Submit>
            </form>
            <ul className="divide-y divide-slate-100 text-sm">
              {p.showings.map((sh) => (
                <li key={sh.id} className="flex items-center justify-between py-2">
                  <span>{label(SHOWING_KINDS, sh.kind)} · {dateTime(sh.startsAt)} · {sh._count.attendees} gestir</span>
                  <Link href={`/opid-hus/${sh.id}`} className="btn-secondary">Gestaskráning →</Link>
                </li>
              ))}
            </ul>
          </section>

          <Tasks items={p.tasks} links={{ propertyId: id }} back={back} />
          <Activities items={p.activities} links={{ propertyId: id }} back={back} />
        </div>
      </div>
    </div>
  );
}
