"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Yfirlit", icon: "M3 12l9-9 9 9M5 10v10h14V10" },
  { href: "/tengilidir", label: "Tengiliðir", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21v-1a6 6 0 0112 0v1" },
  { href: "/eignir", label: "Eignir", icon: "M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" },
  { href: "/solur", label: "Sölur", icon: "M4 6h4v12H4zM10 6h4v8h-4zM16 6h4v5h-4z" },
  { href: "/verkefni", label: "Verkefni", icon: "M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h9" },
  { href: "/dagatal", label: "Dagatal", icon: "M8 3v4M16 3v4M3 9h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function Nav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  const items = isAdmin
    ? [...ITEMS, { href: "/notendur", label: "Notendur", icon: "M12 4a4 4 0 100 8 4 4 0 000-8zM6 20v-1a6 6 0 0112 0v1M19 8v6M22 11h-6" }]
    : ITEMS;
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <>
      {/* Hliðarstika á stærri skjám */}
      <nav className="hidden w-56 shrink-0 flex-col gap-1 border-r border-slate-200 bg-white p-3 md:flex">
        <Link href="/" className="mb-4 flex items-center gap-2 px-2 py-1">
          <img src="/icon.svg" alt="" className="h-8 w-8" />
          <span className="font-semibold">JKJ CRM</span>
        </Link>
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
              active(i.href) ? "bg-brand-50 font-medium text-brand-700" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Icon d={i.icon} />
            {i.label}
          </Link>
        ))}
      </nav>
      {/* Neðsta stika í síma */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {ITEMS.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${active(i.href) ? "text-brand-600" : "text-slate-500"}`}
          >
            <Icon d={i.icon} />
            {i.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
