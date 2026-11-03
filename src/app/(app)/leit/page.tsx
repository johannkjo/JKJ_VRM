import Link from "next/link";
import { ownerScope, requireUser } from "@/lib/auth";
import { DEAL_STAGES, PROPERTY_STATUS, label } from "@/lib/constants";
import { db } from "@/lib/db";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const s = await requireUser();
  const q = ((await searchParams).q ?? "").trim();
  const digits = q.replace(/\D/g, "");
  const [contacts, properties, deals] = q
    ? await Promise.all([
        db.contact.findMany({
          where: {
            ...ownerScope(s, "ownerId"),
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
              { company: { contains: q } },
              ...(digits.length >= 3 ? [{ phone: { contains: digits } }, { kennitala: { contains: digits } }] : []),
            ],
          },
          take: 20,
        }),
        db.property.findMany({
          where: { ...ownerScope(s, "agentId"), OR: [{ address: { contains: q } }, { postcode: { contains: q } }, { fastanumer: { contains: q } }] },
          take: 20,
        }),
        db.deal.findMany({ where: { ...ownerScope(s, "agentId"), title: { contains: q } }, take: 20 }),
      ])
    : [[], [], []];

  return (
    <div className="space-y-4">
      <h1 className="h1">Leit{q && `: „${q}“`}</h1>
      <form><input name="q" defaultValue={q} className="input max-w-md" placeholder="Leita…" autoFocus /></form>
      {q && contacts.length + properties.length + deals.length === 0 && <p className="muted">Ekkert fannst.</p>}
      {contacts.length > 0 && (
        <section className="card">
          <h2 className="h2">Tengiliðir</h2>
          {contacts.map((c) => <Link key={c.id} href={`/tengilidir/${c.id}`} className="block py-1 link">{c.name} <span className="text-slate-400">{c.phone ?? c.email ?? ""}</span></Link>)}
        </section>
      )}
      {properties.length > 0 && (
        <section className="card">
          <h2 className="h2">Eignir</h2>
          {properties.map((p) => <Link key={p.id} href={`/eignir/${p.id}`} className="block py-1 link">{p.address}, {p.postcode} <span className="text-slate-400">{label(PROPERTY_STATUS, p.status)}</span></Link>)}
        </section>
      )}
      {deals.length > 0 && (
        <section className="card">
          <h2 className="h2">Sölur</h2>
          {deals.map((d) => <Link key={d.id} href={`/solur/${d.id}`} className="block py-1 link">{d.title} <span className="text-slate-400">{label(DEAL_STAGES, d.stage)}</span></Link>)}
        </section>
      )}
    </div>
  );
}
