"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { removeFilesFor } from "@/lib/storage";
import { float, int, list, req, str, bool } from "@/lib/forms";
import { assertCanAccess } from "./guard";

function contactData(fd: FormData) {
  return {
    name: req(fd, "name"),
    kennitala: str(fd, "kennitala")?.replace(/\D/g, "") || null,
    email: str(fd, "email")?.toLowerCase() ?? null,
    phone: str(fd, "phone"),
    company: str(fd, "company"),
    roles: list(fd, "roles") ?? "",
    source: str(fd, "source"),
    notes: str(fd, "notes"),
    searchActive: bool(fd, "searchActive"),
    searchListing: str(fd, "searchListing"),
    searchTypes: list(fd, "searchTypes"),
    searchPostcodes: str(fd, "searchPostcodes")?.replace(/\s+/g, "") ?? null,
    searchMinPrice: int(fd, "searchMinPrice"),
    searchMaxPrice: int(fd, "searchMaxPrice"),
    searchMinSize: float(fd, "searchMinSize"),
    searchMaxSize: float(fd, "searchMaxSize"),
    searchMinRooms: int(fd, "searchMinRooms"),
    searchNotes: str(fd, "searchNotes"),
  };
}

export async function createContact(fd: FormData) {
  const s = await requireUser();
  const c = await db.contact.create({ data: { ...contactData(fd), ownerId: s.userId } });
  revalidatePath("/tengilidir");
  redirect(`/tengilidir/${c.id}`);
}

export async function updateContact(id: string, fd: FormData) {
  const s = await requireUser();
  const c = await db.contact.findUniqueOrThrow({ where: { id } });
  assertCanAccess(s, c.ownerId);
  await db.contact.update({ where: { id }, data: contactData(fd) });
  revalidatePath(`/tengilidir/${id}`);
  redirect(`/tengilidir/${id}`);
}

export async function deleteContact(id: string) {
  const s = await requireUser();
  const c = await db.contact.findUniqueOrThrow({ where: { id } });
  assertCanAccess(s, c.ownerId);
  await removeFilesFor({ contactId: id });
  await db.$transaction([
    db.property.updateMany({ where: { sellerId: id }, data: { sellerId: null } }),
    db.deal.updateMany({ where: { buyerId: id }, data: { buyerId: null } }),
    db.deal.updateMany({ where: { sellerId: id }, data: { sellerId: null } }),
    db.offer.updateMany({ where: { bidderId: id }, data: { bidderId: null } }),
    db.showingAttendee.deleteMany({ where: { contactId: id } }),
    db.contact.delete({ where: { id } }),
  ]);
  revalidatePath("/tengilidir");
  redirect("/tengilidir");
}
