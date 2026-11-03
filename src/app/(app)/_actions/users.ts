"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { req } from "@/lib/forms";

export async function createUser(_prev: string | null, fd: FormData): Promise<string | null> {
  await requireAdmin();
  const email = req(fd, "email").toLowerCase();
  const password = req(fd, "password");
  if (password.length < 8) return "Lykilorð verður að vera a.m.k. 8 stafir";
  if (await db.user.findUnique({ where: { email } })) return "Notandi með þetta netfang er þegar til";
  await db.user.create({
    data: { email, name: req(fd, "name"), role: req(fd, "role"), passwordHash: await bcrypt.hash(password, 10) },
  });
  revalidatePath("/notendur");
  return null;
}

export async function toggleUserActive(id: string) {
  const s = await requireAdmin();
  if (id === s.userId) throw new Error("Þú getur ekki gert sjálfan þig óvirkan");
  const u = await db.user.findUniqueOrThrow({ where: { id } });
  await db.user.update({ where: { id }, data: { active: !u.active } });
  revalidatePath("/notendur");
}

export async function changePassword(_prev: string | null, fd: FormData): Promise<string | null> {
  const s = await requireUser();
  const current = req(fd, "current");
  const next = req(fd, "next");
  if (next.length < 8) return "Nýtt lykilorð verður að vera a.m.k. 8 stafir";
  const u = await db.user.findUniqueOrThrow({ where: { id: s.userId } });
  if (!(await bcrypt.compare(current, u.passwordHash))) return "Núverandi lykilorð er rangt";
  await db.user.update({ where: { id: s.userId }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return "Lykilorði breytt ✓";
}

export async function disconnectMicrosoft() {
  const s = await requireUser();
  await db.msAccount.deleteMany({ where: { userId: s.userId } });
  revalidatePath("/notendur");
}
