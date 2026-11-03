"use client";

import { useActionState } from "react";
import { changePassword, createUser } from "@/app/(app)/_actions/users";

export function NewUserForm() {
  const [error, action, pending] = useActionState(createUser, null);
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-2">
      <input name="name" className="input" placeholder="Nafn" required />
      <input name="email" type="email" className="input" placeholder="Netfang" required />
      <input name="password" type="password" className="input" placeholder="Upphafslykilorð (8+ stafir)" required minLength={8} />
      <select name="role" className="input" defaultValue="AGENT">
        <option value="AGENT">Fasteignasali – sér eigin gögn</option>
        <option value="ADMIN">Stjórnandi – sér allt</option>
      </select>
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      <button className="btn sm:col-span-2" disabled={pending}>Stofna notanda</button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [msg, action, pending] = useActionState(changePassword, null);
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-3">
      <input name="current" type="password" className="input" placeholder="Núverandi lykilorð" required />
      <input name="next" type="password" className="input" placeholder="Nýtt lykilorð" required minLength={8} />
      <button className="btn-secondary" disabled={pending}>Breyta lykilorði</button>
      {msg && <p className="text-sm text-slate-600 sm:col-span-3">{msg}</p>}
    </form>
  );
}
