"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form action={action} className="card w-full max-w-sm space-y-4 p-6">
        <div className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="h-9 w-9" />
          <div>
            <h1 className="text-lg font-semibold">JKJ CRM</h1>
            <p className="muted">Skráðu þig inn</p>
          </div>
        </div>
        <div>
          <label className="lbl" htmlFor="email">Netfang</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <label className="lbl" htmlFor="password">Lykilorð</label>
          <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn w-full" disabled={pending}>{pending ? "Skrái inn…" : "Innskrá"}</button>
      </form>
    </main>
  );
}
