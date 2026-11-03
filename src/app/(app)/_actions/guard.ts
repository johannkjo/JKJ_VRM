import type { Session } from "@/lib/session";

/** Kastar villu ef notandi má ekki sjá/breyta gögnum annars notanda. */
export function assertCanAccess(s: Session, ownerId: string) {
  if (s.role !== "ADMIN" && s.userId !== ownerId) throw new Error("Aðgangi hafnað");
}
