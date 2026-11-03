import type { Activity, User } from "@prisma/client";
import { addActivity, deleteActivity } from "@/app/(app)/_actions/common";
import { ACTIVITY_TYPES, label } from "@/lib/constants";
import { dateTime } from "@/lib/format";
import { Submit } from "./Buttons";

type Links = { contactId?: string; propertyId?: string; dealId?: string };

const ICON: Record<string, string> = { CALL: "📞", EMAIL: "✉️", SMS: "💬", MEETING: "🤝", SHOWING: "🏠", NOTE: "📝" };

export default function Activities({ items, links, back }: { items: (Activity & { user: Pick<User, "name"> })[]; links: Links; back: string }) {
  return (
    <section className="card">
      <h2 className="h2">Samskiptasaga</h2>
      <form action={addActivity} className="mb-4 space-y-2">
        {Object.entries(links).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
        <input type="hidden" name="back" value={back} />
        <div className="flex gap-2">
          <select name="type" className="input w-36 shrink-0" defaultValue="CALL">
            {Object.entries(ACTIVITY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input name="body" className="input" placeholder="Hvað gerðist?" required />
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer text-slate-500">+ Eftirfylgni / annar tími</summary>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <input name="occurredAt" type="datetime-local" className="input" title="Hvenær (sjálfgefið: núna)" />
            <input name="followUp" className="input" placeholder="Eftirfylgniverkefni (valkvætt)" />
            <input name="followUpAt" type="datetime-local" className="input" title="Hvenær á að fylgja eftir" />
          </div>
        </details>
        <Submit className="btn-secondary">Skrá</Submit>
      </form>
      {items.length === 0 ? (
        <p className="muted">Engin samskipti skráð enn.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id} className="flex gap-3 text-sm">
              <span className="mt-0.5" title={label(ACTIVITY_TYPES, a.type)}>{ICON[a.type] ?? "•"}</span>
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap">{a.body}</p>
                <p className="text-xs text-slate-400">{dateTime(a.occurredAt)} · {a.user.name}</p>
              </div>
              <form action={deleteActivity.bind(null, a.id, back)}>
                <button className="text-xs text-slate-300 hover:text-red-600" title="Eyða">✕</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
