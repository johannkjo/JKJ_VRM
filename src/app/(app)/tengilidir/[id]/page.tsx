import Link from "next/link";
import { notFound } from "next/navigation";
import Activities from "@/components/Activities";
import { ConfirmSubmit } from "@/components/Buttons";
import Tasks from "@/components/Tasks";
import { ownerScope, requireUser } from "@/lib/auth";
import { CONTACT_ROLES, DEAL_STAGES, LISTING, PROPERTY_STATUS, PROPERTY_TYPES, label, splitList } from "@/lib/constants";
import { db } from "@/lib/db";
import { kr, mkr, num } from "@/lib/format";
import { matchProperty, rankMatches } from "@/lib/matching";
import { deleteContact } from "../../_actions/contacts";

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireUser();
  const { id } = await params;
  const c = await db.contact.findFirst({
    where: { id, ...ownerScope(s, "ownerId") },
    include: {
      activities: { orderBy: { occurredAt: "desc" }, include: { user: { select: { name: true } } } },
      tasks: { orderBy: [{ done: "asc" }, { dueAt: "asc" }] },
      propertiesOwned: true,
      dealsAsBuyer: { include: { property: true } },
      dealsAsSeller: { include: { property: true } },
      attendances: { include: { showing: { include: { property: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!c) notFound();

  const matches = c.searchActive
    ? rankMatches(
        (await db.property.findMany({ where: { status: "ACTIVE", ...ownerScope(s, "agentId") } })).map((p) => ({ item: p, match: matchProperty(c, p) })),
      ).slice(0, 10)
    : [];
  const deals = [...c.dealsAsBuyer, ...c.dealsAsSeller];
  const back = `/tengilidir/${id}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="h1">{c.name}</h1>
          <div className="mt-1 flex flex-wrap gap-1">
            {splitList(c.roles).map((r) => <span key={r} className="badge">{label(CONTACT_ROLES, r)}</span>)}
            {c.company && <span className="badge">{c.company}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {c.phone && <a href={`tel:${c.phone}`} className="btn-secondary">📞 Hringja</a>}
          {c.phone && <a href={`sms:${c.phone}`} className="btn-secondary">💬 SMS</a>}
          {c.email && <a href={`mailto:${c.email}`} className="btn-secondary">✉️ Póstur</a>}
          <Link href={`${back}/breyta`} className="btn-secondary">Breyta</Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <section className="card space-y-1 text-sm">
            <h2 className="h2">Upplýsingar</h2>
            <p><span className="text-slate-500">Sími:</span> {c.phone ?? "—"}</p>
            <p><span className="text-slate-500">Netfang:</span> {c.email ?? "—"}</p>
            <p><span className="text-slate-500">Kennitala:</span> {c.kennitala ?? "—"}</p>
            <p><span className="text-slate-500">Uppruni:</span> {c.source ?? "—"}</p>
            {c.notes && <p className="whitespace-pre-wrap pt-2">{c.notes}</p>}
          </section>

          {c.searchActive && (
            <section className="card space-y-1 text-sm">
              <h2 className="h2">Leitar að</h2>
              <p>{c.searchListing ? label(LISTING, c.searchListing) : "Kaup eða leiga"} · {splitList(c.searchTypes).map((t) => label(PROPERTY_TYPES, t)).join(", ") || "allar gerðir"}</p>
              <p>Verð: {mkr(c.searchMinPrice)} – {mkr(c.searchMaxPrice)}</p>
              <p>Stærð: {num(c.searchMinSize)} – {num(c.searchMaxSize)} m² · {c.searchMinRooms ? `${c.searchMinRooms}+ herb.` : ""}</p>
              <p>Póstnúmer: {c.searchPostcodes ?? "öll"}</p>
              {c.searchNotes && <p className="text-slate-600">{c.searchNotes}</p>}
            </section>
          )}

          {(deals.length > 0 || c.propertiesOwned.length > 0) && (
            <section className="card space-y-2 text-sm">
              <h2 className="h2">Eignir og sölur</h2>
              {c.propertiesOwned.map((p) => (
                <Link key={p.id} href={`/eignir/${p.id}`} className="block link">🏠 {p.address} – {label(PROPERTY_STATUS, p.status)}</Link>
              ))}
              {deals.map((d) => (
                <Link key={d.id} href={`/solur/${d.id}`} className="block link">📈 {d.title} – {label(DEAL_STAGES, d.stage)}</Link>
              ))}
            </section>
          )}

          {c.attendances.length > 0 && (
            <section className="card space-y-1 text-sm">
              <h2 className="h2">Sýningar sem viðkomandi mætti á</h2>
              {c.attendances.map((a) => (
                <p key={a.id}>
                  <Link className="link" href={`/eignir/${a.showing.propertyId}`}>{a.showing.property.address}</Link>
                  {a.interest && ` · áhugi ${a.interest}/5`}
                </p>
              ))}
            </section>
          )}

          <form action={deleteContact.bind(null, id)}>
            <ConfirmSubmit message={`Eyða ${c.name} og allri sögu? Þetta er ekki hægt að afturkalla.`}>Eyða tengilið</ConfirmSubmit>
          </form>
        </div>

        <div className="space-y-4 lg:col-span-2">
          {c.searchActive && (
            <section className="card">
              <h2 className="h2">Eignir sem passa ({matches.length})</h2>
              {matches.length === 0 && <p className="muted">Engar virkar eignir passa við leitarprófílinn eins og er.</p>}
              <ul className="divide-y divide-slate-100">
                {matches.map(({ item: p, match }) => (
                  <li key={p.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className="w-12 rounded bg-brand-50 py-1 text-center font-semibold text-brand-700">{match.score}%</span>
                    <div className="flex-1">
                      <Link href={`/eignir/${p.id}`} className="link font-medium">{p.address}, {p.postcode}</Link>
                      <p className="text-xs text-slate-500">{kr(p.price)} · {num(p.size)} m² · {match.reasons.join(" · ")}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <Tasks items={c.tasks} links={{ contactId: id }} back={back} />
          <Activities items={c.activities} links={{ contactId: id }} back={back} />
        </div>
      </div>
    </div>
  );
}
