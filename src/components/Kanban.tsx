"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { moveDeal } from "@/app/(app)/_actions/deals";

export type KanbanDeal = {
  id: string;
  title: string;
  stage: string;
  listing: string;
  value: number | null;
  commission: number | null;
  party: string | null;
  expectedClose: string | null;
};

// Óháð staðfærslu vafra svo þjónn og vafri skili sama texta (forðast hydration-villu)
const mkr = (n: number | null) => {
  if (n == null) return "";
  const v = (Math.round(n / 100_000) / 10).toFixed(1).replace(/\.0$/, "").replace(".", ",");
  return `${v} m.kr.`;
};

export default function Kanban({ deals, stages }: { deals: KanbanDeal[]; stages: [string, string][] }) {
  const [, start] = useTransition();
  const [items, setOptimistic] = useOptimistic(deals, (state, { id, stage }: { id: string; stage: string }) =>
    state.map((d) => (d.id === id ? { ...d, stage } : d)),
  );
  const move = (id: string, stage: string) =>
    start(async () => {
      setOptimistic({ id, stage });
      await moveDeal(id, stage);
    });

  return (
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4">
      {stages.map(([key, name]) => {
        const col = items.filter((d) => d.stage === key);
        const total = col.reduce((s, d) => s + (d.commission ?? 0), 0);
        return (
          <div
            key={key}
            className="flex w-72 shrink-0 snap-start flex-col rounded-xl bg-slate-100 p-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/plain");
              if (id) move(id, key);
            }}
          >
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h3 className="text-sm font-semibold">{name} <span className="font-normal text-slate-500">({col.length})</span></h3>
              {total > 0 && <span className="text-xs text-slate-500" title="Áætluð þóknun">{mkr(total)}</span>}
            </div>
            <div className="flex min-h-16 flex-col gap-2">
              {col.map((d) => (
                <div
                  key={d.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", d.id)}
                  className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm active:cursor-grabbing"
                >
                  <Link href={`/solur/${d.id}`} className="font-medium hover:underline">{d.title}</Link>
                  <p className="text-xs text-slate-500">
                    {d.listing === "RENT" ? "Leiga" : "Sala"}{d.value ? ` · ${mkr(d.value)}` : ""}{d.party ? ` · ${d.party}` : ""}
                  </p>
                  {d.expectedClose && <p className="text-xs text-slate-400">Áætluð lok {d.expectedClose}</p>}
                  <select
                    aria-label="Færa á stig"
                    className="mt-2 w-full rounded border border-slate-200 bg-slate-50 px-1 py-1 text-xs"
                    value={d.stage}
                    onChange={(e) => move(d.id, e.target.value)}
                  >
                    {stages.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    <option value="CLOSED">Afsal / lokið</option>
                    <option value="LOST">Tapað</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
