"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { dt, int, req, str } from "@/lib/forms";
import { assertCanAccess } from "./guard";

export async function createShowing(fd: FormData) {
  const s = await requireUser();
  const propertyId = req(fd, "propertyId");
  const p = await db.property.findUniqueOrThrow({ where: { id: propertyId } });
  assertCanAccess(s, p.agentId);
  const startsAt = dt(fd, "startsAt");
  if (!startsAt) throw new Error("Tími vantar");
  await db.showing.create({
    data: { propertyId, kind: req(fd, "kind"), startsAt, endsAt: dt(fd, "endsAt"), notes: str(fd, "notes") },
  });
  revalidatePath(`/eignir/${propertyId}`);
  revalidatePath("/dagatal");
  revalidatePath("/");
}

export async function deleteShowing(id: string) {
  const s = await requireUser();
  const sh = await db.showing.findUniqueOrThrow({ where: { id }, include: { property: true } });
  assertCanAccess(s, sh.property.agentId);
  await db.showing.delete({ where: { id } });
  revalidatePath("/dagatal");
  redirect(`/eignir/${sh.propertyId}`);
}

/**
 * Skráning gesta á opnu húsi (hönnuð fyrir síma).
 * Finnur tengilið eftir síma eða netfangi, annars er nýr búinn til sem kaupandi.
 */
export async function registerAttendee(showingId: string, fd: FormData) {
  const s = await requireUser();
  const sh = await db.showing.findUniqueOrThrow({ where: { id: showingId }, include: { property: true } });
  assertCanAccess(s, sh.property.agentId);

  const name = req(fd, "name");
  const phone = str(fd, "phone")?.replace(/[^\d+]/g, "") || null;
  const email = str(fd, "email")?.toLowerCase() ?? null;
  const interest = int(fd, "interest");
  const feedback = str(fd, "feedback");

  const or = [...(phone ? [{ phone }] : []), ...(email ? [{ email }] : [])];
  let contact = or.length ? await db.contact.findFirst({ where: { OR: or } }) : null;
  const role = sh.property.listing === "RENT" ? "TENANT" : "BUYER";
  if (!contact) {
    contact = await db.contact.create({
      data: {
        name,
        phone,
        email,
        roles: role,
        source: `Opið hús – ${sh.property.address}`,
        ownerId: s.userId,
      },
    });
  } else if (!contact.roles.split(",").includes(role)) {
    await db.contact.update({
      where: { id: contact.id },
      data: { roles: [contact.roles, role].filter(Boolean).join(",") },
    });
  }

  await db.showingAttendee.create({ data: { showingId, contactId: contact.id, interest, feedback } });
  await db.activity.create({
    data: {
      type: "SHOWING",
      body: `Mætti á ${sh.kind === "OPEN_HOUSE" ? "opið hús" : "sýningu"} – ${sh.property.address}${
        interest ? ` (áhugi ${interest}/5)` : ""
      }${feedback ? `: ${feedback}` : ""}`,
      occurredAt: new Date(),
      userId: s.userId,
      contactId: contact.id,
      propertyId: sh.propertyId,
    },
  });
  // Eftirfylgni næsta dag fyrir þá sem sýna mikinn áhuga
  if (interest && interest >= 4) {
    const due = new Date();
    due.setUTCDate(due.getUTCDate() + 1);
    due.setUTCHours(10, 0, 0, 0);
    await db.task.create({
      data: {
        title: `Hringja í ${name} eftir sýningu – ${sh.property.address}`,
        dueAt: due,
        priority: 1,
        userId: s.userId,
        contactId: contact.id,
        propertyId: sh.propertyId,
      },
    });
  }
  revalidatePath(`/opid-hus/${showingId}`);
}
