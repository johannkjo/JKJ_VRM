import Link from "next/link";
import type { Task } from "@prisma/client";
import { addTask, deleteTask, toggleTask } from "@/app/(app)/_actions/common";
import { dateTime } from "@/lib/format";
import { Submit } from "./Buttons";

type Links = { contactId?: string; propertyId?: string; dealId?: string };
type TaskWith = Task & {
  contact?: { id: string; name: string } | null;
  property?: { id: string; address: string } | null;
  deal?: { id: string; title: string } | null;
};

export function TaskRow({ t, back, showLinks }: { t: TaskWith; back: string; showLinks?: boolean }) {
  const overdue = !t.done && t.dueAt && t.dueAt < new Date();
  return (
    <li className="flex items-start gap-3 py-2 text-sm">
      <form action={toggleTask.bind(null, t.id, back)}>
        <button
          className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${t.done ? "border-brand-500 bg-brand-500 text-white" : "border-slate-300 bg-white"}`}
          title={t.done ? "Merkja ólokið" : "Merkja lokið"}
        >
          {t.done && "✓"}
        </button>
      </form>
      <div className="min-w-0 flex-1">
        <p className={t.done ? "text-slate-400 line-through" : ""}>
          {t.priority === 1 && !t.done && <span className="mr-1 text-red-600">●</span>}
          {t.title}
        </p>
        <p className="text-xs text-slate-400">
          {t.dueAt && <span className={overdue ? "font-medium text-red-600" : ""}>{dateTime(t.dueAt)}</span>}
          {showLinks && t.contact && <> · <Link className="link" href={`/tengilidir/${t.contact.id}`}>{t.contact.name}</Link></>}
          {showLinks && t.property && <> · <Link className="link" href={`/eignir/${t.property.id}`}>{t.property.address}</Link></>}
          {showLinks && t.deal && <> · <Link className="link" href={`/solur/${t.deal.id}`}>{t.deal.title}</Link></>}
        </p>
      </div>
      <form action={deleteTask.bind(null, t.id, back)}>
        <button className="text-xs text-slate-300 hover:text-red-600" title="Eyða">✕</button>
      </form>
    </li>
  );
}

export function NewTaskForm({ links = {}, back }: { links?: Links; back: string }) {
  return (
    <form action={addTask} className="flex flex-wrap gap-2">
      {Object.entries(links).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
      <input type="hidden" name="back" value={back} />
      <input name="title" className="input min-w-48 flex-1" placeholder="Nýtt verkefni…" required />
      <input name="dueAt" type="datetime-local" className="input w-auto" />
      <select name="priority" className="input w-auto" defaultValue="2">
        <option value="1">Mikilvægt</option>
        <option value="2">Venjulegt</option>
        <option value="3">Lágt</option>
      </select>
      <Submit className="btn-secondary">Bæta við</Submit>
    </form>
  );
}

export default function Tasks({ items, links, back }: { items: TaskWith[]; links: Links; back: string }) {
  const open = items.filter((t) => !t.done);
  const done = items.filter((t) => t.done);
  return (
    <section className="card">
      <h2 className="h2">Verkefni</h2>
      <NewTaskForm links={links} back={back} />
      <ul className="mt-2 divide-y divide-slate-100">
        {open.map((t) => <TaskRow key={t.id} t={t} back={back} />)}
      </ul>
      {open.length === 0 && <p className="muted mt-2">Engin opin verkefni.</p>}
      {done.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-slate-500">Lokið ({done.length})</summary>
          <ul className="divide-y divide-slate-100">{done.map((t) => <TaskRow key={t.id} t={t} back={back} />)}</ul>
        </details>
      )}
    </section>
  );
}
