"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { req } from "@/lib/forms";
import { sendMail } from "@/lib/integrations/microsoft";
import { assertCanAccess } from "./guard";

/** Sendir tölvupóst á tengilið í gegnum Outlook og skráir í samskiptasögu. Skilar villu eða null. */
export async function sendEmailToContact(contactId: string, _prev: string | null, fd: FormData): Promise<string | null> {
  const s = await requireUser();
  const c = await db.contact.findUniqueOrThrow({ where: { id: contactId } });
  assertCanAccess(s, c.ownerId);
  if (!c.email) return "Tengiliður hefur ekkert netfang";
  const subject = req(fd, "subject");
  const body = req(fd, "body");
  try {
    await sendMail(s.userId, c.email, subject, body);
  } catch (e) {
    return (e as Error).message;
  }
  await db.activity.create({
    data: { type: "EMAIL", body: `Sendi tölvupóst: „${subject}“\n\n${body}`, userId: s.userId, contactId },
  });
  revalidatePath(`/tengilidir/${contactId}`);
  return "sent";
}
