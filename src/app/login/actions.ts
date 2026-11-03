"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

export async function login(_prev: string | null, fd: FormData): Promise<string | null> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
    return "Rangt netfang eða lykilorð";
  }
  const token = await signSession({ userId: user.id, role: user.role as "ADMIN" | "AGENT", name: user.name });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
