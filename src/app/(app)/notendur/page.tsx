import { ChangePasswordForm, NewUserForm } from "@/components/UserForms";
import { requireUser } from "@/lib/auth";
import { ROLES, label } from "@/lib/constants";
import { db } from "@/lib/db";
import { msConfigured } from "@/lib/integrations/microsoft";
import { disconnectMicrosoft, toggleUserActive } from "../_actions/users";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ ms?: string }> }) {
  const s = await requireUser();
  const { ms } = await searchParams;
  const msAccount = await db.msAccount.findUnique({ where: { userId: s.userId } });
  const users = s.role === "ADMIN" ? await db.user.findMany({ orderBy: { createdAt: "asc" } }) : [];
  return (
    <div className="space-y-4">
      <h1 className="h1">{s.role === "ADMIN" ? "Notendur og aðgangur" : "Stillingar"}</h1>
      <section className="card">
        <h2 className="h2">Microsoft 365 (Outlook)</h2>
        {ms === "ok" && <p className="mb-2 text-sm text-brand-700">✓ Tenging tókst</p>}
        {ms && ms !== "ok" && <p className="mb-2 text-sm text-red-600">{ms}</p>}
        {!msConfigured() ? (
          <p className="muted">Microsoft 365 hefur ekki verið stillt á þjóninum. Sjá leiðbeiningar í README (MS_CLIENT_ID / MS_CLIENT_SECRET).</p>
        ) : msAccount ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm">Tengt sem <b>{msAccount.email}</b>. Sýningar fara sjálfkrafa í Outlook-dagatalið og póstar birtast á tengiliðum.</p>
            <form action={disconnectMicrosoft}><button className="btn-secondary">Aftengja</button></form>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="muted">Tengdu Outlook til að samstilla dagatal og sjá/senda tölvupósta úr kerfinu.</p>
            <a href="/api/microsoft/connect" className="btn">Tengja Microsoft 365</a>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="h2">Mitt lykilorð</h2>
        <ChangePasswordForm />
      </section>
      {s.role === "ADMIN" && (
        <>
          <section className="card">
            <h2 className="h2">Notendur</h2>
            <ul className="divide-y divide-slate-100 text-sm">
              {users.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div>
                    <p className={`font-medium ${u.active ? "" : "text-slate-400 line-through"}`}>{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email} · {label(ROLES, u.role)}</p>
                  </div>
                  {u.id !== s.userId && (
                    <form action={toggleUserActive.bind(null, u.id)}>
                      <button className="btn-secondary">{u.active ? "Gera óvirkan" : "Virkja"}</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </section>
          <section className="card">
            <h2 className="h2">Nýr notandi</h2>
            <p className="muted mb-3">Fasteignasalar sjá eingöngu eigin tengiliði, eignir og sölur. Stjórnendur sjá allt.</p>
            <NewUserForm />
          </section>
        </>
      )}
    </div>
  );
}
