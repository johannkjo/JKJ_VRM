import Link from "next/link";
import { ownerScope, requireUser } from "@/lib/auth";
import { LISTING, PROPERTY_STATUS, PROPERTY_TYPES, label } from "@/lib/constants";
import { db } from "@/lib/db";
import { kr, num } from "@/lib/format";

const STATUS_COLOR: Record<string, string> = {
  VALUATION: "bg-amber-50 text-amber-700",
  ACTIVE: "bg-brand-50 text-brand-700",
  RESERVED: "bg-violet-50 text-violet-700",
  SOLD: "bg-slate-200 text-slate-700",
  RENTED: "bg-slate-200 text-slate-700",
  WITHDRAWN: "bg-red-50 text-red-700",
};

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<{ q?: string; listing?: string; status?: string; type?: string }> }) {
  const s = await requireUser();
  const { q, listing, status, type } = await searchParams;
  const props = await db.property.findMany({
    where: {
      ...ownerScope(s, "agentId"),
      ...(listing ? { listing } : {}),
      ...(status ? { status } : { status: { notIn: ["SOLD", "RENTED", "WITHDRAWN"] } }),
      ...(type ? { type } : {}),
      ...(q ? { OR: [{ address: { contains: q } }, { postcode: { contains: q } }, { fastanumer: { contains: q } }] } : {}),
    },
    include: { seller: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="h1">Eignir</h1>
        <Link href="/eignir/ny" className="btn">+ Ný eign</Link>
      </div>
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Heimilisfang, póstnr., fastanr." className="input max-w-xs" />
        <select name="listing" defaultValue={listing ?? ""} className="input w-auto">
          <option value="">Sala og leiga</option>
          {Object.entries(LISTING).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="type" defaultValue={type ?? ""} className="input w-auto">
          <option value="">Allar gerðir</option>
          {Object.entries(PROPERTY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="status" defaultValue={status ?? ""} className="input w-auto">
          <option value="">Virkar eignir</option>
          {Object.entries(PROPERTY_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn-secondary">Sía</button>
      </form>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {props.length === 0 && <p className="muted">Engar eignir fundust.</p>}
        {props.map((p) => (
          <Link key={p.id} href={`/eignir/${p.id}`} className="card block hover:border-brand-500">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{p.address}</p>
                <p className="text-sm text-slate-500">{p.postcode} {p.city}</p>
              </div>
              <span className={`badge ${STATUS_COLOR[p.status] ?? ""}`}>{label(PROPERTY_STATUS, p.status)}</span>
            </div>
            <p className="mt-2 text-lg font-semibold">{kr(p.price)}{p.listing === "RENT" && <span className="text-sm font-normal text-slate-500"> /mán.</span>}</p>
            <p className="text-sm text-slate-600">
              {label(PROPERTY_TYPES, p.type)} · {label(LISTING, p.listing)} · {num(p.size)} m²{p.rooms ? ` · ${p.rooms} herb.` : ""}
            </p>
            {p.seller && <p className="mt-1 text-xs text-slate-400">Seljandi: {p.seller.name}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
