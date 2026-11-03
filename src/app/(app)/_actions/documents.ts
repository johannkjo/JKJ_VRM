"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { str } from "@/lib/forms";
import { MAX_UPLOAD_BYTES, removeStored, saveFile } from "@/lib/storage";
import type { Session } from "@/lib/session";
import { assertCanAccess } from "./guard";

async function assertLinkAccess(s: Session, l: { contactId?: string | null; propertyId?: string | null; dealId?: string | null }) {
  if (l.propertyId) assertCanAccess(s, (await db.property.findUniqueOrThrow({ where: { id: l.propertyId } })).agentId);
  else if (l.dealId) assertCanAccess(s, (await db.deal.findUniqueOrThrow({ where: { id: l.dealId } })).agentId);
  else if (l.contactId) assertCanAccess(s, (await db.contact.findUniqueOrThrow({ where: { id: l.contactId } })).ownerId);
  else throw new Error("Skjal verður að tengjast tengilið, eign eða sölu");
}

export async function uploadDocuments(_prev: string | null, fd: FormData): Promise<string | null> {
  const s = await requireUser();
  const links = { contactId: str(fd, "contactId"), propertyId: str(fd, "propertyId"), dealId: str(fd, "dealId") };
  await assertLinkAccess(s, links);
  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return "Engin skrá valin";
  const tooBig = files.find((f) => f.size > MAX_UPLOAD_BYTES);
  if (tooBig) return `${tooBig.name} er of stór (hámark 25 MB)`;
  for (const f of files) {
    const storedName = await saveFile(f);
    await db.document.create({
      data: {
        name: f.name,
        storedName,
        mime: f.type || "application/octet-stream",
        size: f.size,
        kind: f.type.startsWith("image/") ? "PHOTO" : "DOC",
        userId: s.userId,
        ...links,
      },
    });
  }
  const back = str(fd, "back");
  if (back) revalidatePath(back);
  return null;
}

export async function deleteDocument(id: string, back: string) {
  const s = await requireUser();
  const d = await db.document.findUniqueOrThrow({ where: { id } });
  await assertLinkAccess(s, d);
  await db.document.delete({ where: { id } });
  await removeStored(d.storedName);
  revalidatePath(back);
}
