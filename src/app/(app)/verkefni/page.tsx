import Link from "next/link";
import { NewTaskForm, TaskRow } from "@/components/Tasks";
import { ownerScope, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ syna?: string }> }) {
  const s = await requireUser();
  const { syna } = await searchParams;
  const showDone = syna === "lokid";
  const tasks = await db.task.findMany({
    where: { ...ownerScope(s, "userId"), done: showDone },
    include: { contact: { select: { id: true, name: true } }, property: { select: { id: true, address: true } }, deal: { select: { id: true, title: true } } },
    orderBy: showDone ? [{ doneAt: "desc" }] : [{ dueAt: "asc" }, { priority: "asc" }],
    take: 300,
  });
  const now = new Date();
  const endToday = new Date(now);
  endToday.setUTCHours(23, 59, 59, 999);
  const endWeek = new Date(endToday.getTime() + 6 * 864e5);
  const groups = showDone
    ? [{ name: "Lokið", items: tasks }]
    : [
        { name: "Í vanskilum", items: tasks.filter((t) => t.dueAt && t.dueAt < now) },
        { name: "Í dag", items: tasks.filter((t) => t.dueAt && t.dueAt >= now && t.dueAt <= endToday) },
        { name: "Næstu 7 dagar", items: tasks.filter((t) => t.dueAt && t.dueAt > endToday && t.dueAt <= endWeek) },
        { name: "Síðar", items: tasks.filter((t) => t.dueAt && t.dueAt > endWeek) },
        { name: "Án dagsetningar", items: tasks.filter((t) => !t.dueAt) },
      ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="h1">Verkefni</h1>
        <Link href={showDone ? "/verkefni" : "/verkefni?syna=lokid"} className="btn-secondary">{showDone ? "Sýna opin" : "Sýna lokin"}</Link>
      </div>
      {!showDone && <div className="card"><NewTaskForm back="/verkefni" /></div>}
      {groups.filter((g) => g.items.length).map((g) => (
        <section key={g.name} className="card">
          <h2 className={`h2 ${g.name === "Í vanskilum" ? "text-red-700" : ""}`}>{g.name} ({g.items.length})</h2>
          <ul className="divide-y divide-slate-100">{g.items.map((t) => <TaskRow key={t.id} t={t} back="/verkefni" showLinks />)}</ul>
        </section>
      ))}
      {tasks.length === 0 && <p className="muted">Engin verkefni.</p>}
    </div>
  );
}
