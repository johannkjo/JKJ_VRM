import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { SESSION_COOKIE, verifySession, type Session } from "./session";

/** Sækir innskráðan notanda; vísar á innskráningu ef enginn er (eða notandi óvirkur). */
export async function requireUser(): Promise<Session> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const s = await verifySession(token);
  if (!s) redirect("/login");
  const user = await db.user.findUnique({ where: { id: s.userId }, select: { active: true, role: true, name: true } });
  if (!user || !user.active) redirect("/login");
  return { userId: s.userId, role: user.role as Session["role"], name: user.name };
}

export async function requireAdmin(): Promise<Session> {
  const s = await requireUser();
  if (s.role !== "ADMIN") redirect("/");
  return s;
}

/**
 * Aðgangsstýring: stjórnandi sér allt, fasteignasali sér eingöngu eigin gögn.
 * Skilar Prisma where-skilyrði eftir svæðisheiti eiganda.
 */
export function ownerScope(s: Session, field: "ownerId" | "agentId" | "userId") {
  return s.role === "ADMIN" ? {} : { [field]: s.userId };
}
