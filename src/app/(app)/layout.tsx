import Link from "next/link";
import Nav from "@/components/Nav";
import { requireUser } from "@/lib/auth";
import { logout } from "../login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen">
      <Nav isAdmin={user.role === "ADMIN"} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-2 backdrop-blur">
          <Link href="/" className="md:hidden"><img src="/icon.svg" alt="JKJ CRM" className="h-7 w-7" /></Link>
          <form action="/leit" className="flex-1">
            <input name="q" placeholder="Leita að tengilið, eign, kennitölu, síma…" className="input max-w-md" />
          </form>
          <Link href="/notendur" className="muted" title="Stillingar">⚙︎</Link>
          <span className="hidden text-sm text-slate-600 sm:inline">{user.name}</span>
          <form action={logout}>
            <button className="text-sm text-slate-500 hover:text-slate-800">Útskrá</button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-24 md:pb-8">{children}</main>
      </div>
    </div>
  );
}
