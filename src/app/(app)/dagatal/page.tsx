import Link from "next/link";
import { ownerScope, requireUser } from "@/lib/auth";
import { SHOWING_KINDS, label } from "@/lib/constants";
import { db } from "@/lib/db";
import { listEvents, type OutlookEvent } from "@/lib/integrations/microsoft";

const TZ = "Atlantic/Reykjavik";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ vika?: string }> }) {
  const s = await requireUser();
  const offset = parseInt((await searchParams).vika ?? "0", 10) || 0;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7) + offset * 7); // mánudagur
  const end = new Date(start.getTime() + 7 * 864e5);

  const [showings, tasks] = await Promise.all([
    db.showing.findMany({
      where: { startsAt: { gte: start, lt: end }, property: ownerScope(s, "agentId") },
      include: { property: { select: { address: true } }, _count: { select: { attendees: true } } },
      orderBy: { startsAt: "asc" },
    }),
    db.task.findMany({
      where: { ...ownerScope(s, "userId"), dueAt: { gte: start, lt: end } },
      orderBy: { dueAt: "asc" },
    }),
  ]);

  // Outlook-viðburðir (ef tengt). Sleppum þeim sem CRM bjó sjálft til (sýningar).
  let outlook: OutlookEvent[] | null = null;
  let outlookError: string | null = null;
  try {
    outlook = await listEvents(s.userId, start, end);
  } catch (e) {
    outlookError = (e as Error).message;
  }
  const crmEventIds = new Set(showings.map((x) => x.outlookEventId).filter(Boolean));
  const external = (outlook ?? []).filter((e) => !crmEventIds.has(e.id));

  const days = Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * 864e5));
  const sameDay = (a: Date, b: Date) => a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
  const time = (d: Date) => d.toLocaleTimeString("is-IS", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
  const today = new Date();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="h1">Dagatal</h1>
        <div className="flex gap-2">
          <Link href={`/dagatal?vika=${offset - 1}`} className="btn-secondary">←</Link>
          <Link href="/dagatal" className="btn-secondary">Þessi vika</Link>
          <Link href={`/dagatal?vika=${offset + 1}`} className="btn-secondary">→</Link>
        </div>
      </div>
      <p className="muted">
        Sýningar eru skráðar á síðu hverrar eignar.{" "}
        {outlook ? "Grænt = CRM, blátt = Outlook." : <>Tengdu <Link href="/notendur" className="link">Microsoft 365</Link> til að sjá Outlook-dagatalið hér.</>}
      </p>
      {outlookError && <p className="text-sm text-red-600">Outlook: {outlookError}</p>}
      <div className="grid gap-3 md:grid-cols-7">
        {days.map((d) => {
          const sh = showings.filter((x) => sameDay(x.startsAt, d));
          const ts = tasks.filter((x) => x.dueAt && sameDay(x.dueAt, d));
          const ev = external.filter((x) => sameDay(x.start, d));
          return (
            <div key={d.toISOString()} className={`card min-h-32 p-3 ${sameDay(d, today) ? "ring-2 ring-brand-500" : ""}`}>
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                {d.toLocaleDateString("is-IS", { weekday: "short", day: "numeric", month: "short", timeZone: TZ })}
              </p>
              <ul className="space-y-1.5 text-xs">
                {sh.map((x) => (
                  <li key={x.id}>
                    <Link href={`/opid-hus/${x.id}`} className="block rounded bg-brand-50 p-1.5 text-brand-700 hover:bg-brand-100">
                      <b>{time(x.startsAt)}</b> {label(SHOWING_KINDS, x.kind)}<br />{x.property.address}
                    </Link>
                  </li>
                ))}
                {ev.map((x) => (
                  <li key={x.id}>
                    <a href={x.webLink} target="_blank" rel="noreferrer" className="block rounded bg-sky-50 p-1.5 text-sky-800 hover:bg-sky-100">
                      <b>{time(x.start)}</b> {x.subject}
                    </a>
                  </li>
                ))}
                {ts.map((t) => (
                  <li key={t.id} className={`rounded bg-slate-50 p-1.5 ${t.done ? "text-slate-400 line-through" : ""}`}>
                    <b>{time(t.dueAt!)}</b> {t.title}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
