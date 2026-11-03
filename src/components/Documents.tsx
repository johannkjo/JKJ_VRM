import type { Document } from "@prisma/client";
import { deleteDocument } from "@/app/(app)/_actions/documents";
import { date } from "@/lib/format";
import UploadForm from "./UploadForm";

type Links = { contactId?: string; propertyId?: string; dealId?: string };

function size(n: number) {
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.ceil(n / 1024)} KB`;
}

export default function Documents({ items, links, back, title = "Myndir og skjöl" }: { items: Document[]; links: Links; back: string; title?: string }) {
  const photos = items.filter((d) => d.kind === "PHOTO");
  const docs = items.filter((d) => d.kind !== "PHOTO");
  return (
    <section className="card">
      <h2 className="h2">{title}</h2>
      <UploadForm links={links} back={back} />
      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
              <a href={`/api/skjol/${p.id}`} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/skjol/${p.id}`} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
              </a>
              <form action={deleteDocument.bind(null, p.id, back)} className="absolute right-1 top-1 hidden group-hover:block">
                <button className="rounded bg-white/90 px-1.5 text-xs text-red-600" title="Eyða">✕</button>
              </form>
            </div>
          ))}
        </div>
      )}
      {docs.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-100 text-sm">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 py-2">
              <a href={`/api/skjol/${d.id}`} target="_blank" rel="noreferrer" className="link truncate">📄 {d.name}</a>
              <span className="shrink-0 text-xs text-slate-400">{size(d.size)} · {date(d.createdAt)}</span>
              <form action={deleteDocument.bind(null, d.id, back)}>
                <button className="text-xs text-slate-300 hover:text-red-600" title="Eyða">✕</button>
              </form>
            </li>
          ))}
        </ul>
      )}
      {items.length === 0 && <p className="muted mt-2">Engin skjöl enn.</p>}
    </section>
  );
}
