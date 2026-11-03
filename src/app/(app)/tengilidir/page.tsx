import Link from "next/link";
import { ownerScope, requireUser } from "@/lib/auth";
import { CONTACT_ROLES, label, splitList } from "@/lib/constants";
import { db } from "@/lib/db";

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const s = await requireUser();
  const { q, role } = await searchParams;
  const contacts = await db.contact.findMany({
    where: {
      ...ownerScope(s, "ownerId"),
      ...(role ? { roles: { contains: role } } : {}),
      ...(q
        ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }, { kennitala: { contains: q } }, { company: { contains: q } }] }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="h1">Tengiliðir</h1>
        <Link href="/tengilidir/nyr" className="btn">+ Nýr tengiliður</Link>
      </div>
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Leita…" className="input max-w-xs" />
        <select name="role" defaultValue={role ?? ""} className="input w-auto">
          <option value="">Öll hlutverk</option>
          {Object.entries(CONTACT_ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn-secondary">Sía</button>
      </form>
      <div className="card divide-y divide-slate-100 p-0">
        {contacts.length === 0 && <p className="muted p-4">Engir tengiliðir fundust.</p>}
        {contacts.map((c) => (
          <Link key={c.id} href={`/tengilidir/${c.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-slate-50">
            <span className="min-w-40 flex-1 font-medium">
              {c.name}
              {c.searchActive && <span className="badge ml-2 bg-brand-50 text-brand-700">Í leit</span>}
            </span>
            <span className="flex gap-1">{splitList(c.roles).map((r) => <span key={r} className="badge">{label(CONTACT_ROLES, r)}</span>)}</span>
            <span className="w-32 text-sm text-slate-500">{c.phone ?? ""}</span>
            <span className="hidden w-56 truncate text-sm text-slate-500 sm:block">{c.email ?? ""}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
