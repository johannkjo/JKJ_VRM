"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { removeFilesFor } from "@/lib/storage";
import { bool, int, float, req, str } from "@/lib/forms";
import { publishToAuglysing } from "@/lib/integrations/auglysing";
import { assertCanAccess } from "./guard";

function propertyData(fd: FormData) {
  return {
    address: req(fd, "address"),
    postcode: req(fd, "postcode"),
    city: str(fd, "city"),
    fastanumer: str(fd, "fastanumer"),
    listingUrl: str(fd, "listingUrl"),
    type: req(fd, "type"),
    listing: req(fd, "listing"),
    status: str(fd, "status") ?? "VALUATION",
    price: int(fd, "price"),
    size: float(fd, "size"),
    rooms: int(fd, "rooms"),
    bedrooms: int(fd, "bedrooms"),
    bathrooms: int(fd, "bathrooms"),
    yearBuilt: int(fd, "yearBuilt"),
    fasteignamat: int(fd, "fasteignamat"),
    brunabotamat: int(fd, "brunabotamat"),
    garage: bool(fd, "garage"),
    elevator: bool(fd, "elevator"),
    description: str(fd, "description"),
    features: str(fd, "features"),
    sellerId: str(fd, "sellerId"),
  };
}

async function load(id: string) {
  const s = await requireUser();
  const p = await db.property.findUniqueOrThrow({ where: { id } });
  assertCanAccess(s, p.agentId);
  return { s, p };
}

export async function createProperty(fd: FormData) {
  const s = await requireUser();
  const p = await db.property.create({ data: { ...propertyData(fd), agentId: s.userId } });
  revalidatePath("/eignir");
  redirect(`/eignir/${p.id}`);
}

export async function updateProperty(id: string, fd: FormData) {
  await load(id);
  await db.property.update({ where: { id }, data: propertyData(fd) });
  revalidatePath(`/eignir/${id}`);
  redirect(`/eignir/${id}`);
}

export async function setPropertyStatus(id: string, status: string) {
  await load(id);
  await db.property.update({ where: { id }, data: { status } });
  revalidatePath(`/eignir/${id}`);
  revalidatePath("/eignir");
}

export async function deleteProperty(id: string) {
  await load(id);
  await removeFilesFor({ propertyId: id });
  await db.$transaction([
    db.deal.updateMany({ where: { propertyId: id }, data: { propertyId: null } }),
    db.property.delete({ where: { id } }),
  ]);
  revalidatePath("/eignir");
  redirect("/eignir");
}

export async function publishAd(id: string) {
  const { s, p } = await load(id);
  const result = await publishToAuglysing(p);
  await db.property.update({
    where: { id },
    data: {
      adStatus: result.published ? "PUBLISHED" : "DRAFT",
      adExternalId: result.externalId ?? p.adExternalId,
      adPublishedAt: result.published ? new Date() : p.adPublishedAt,
      status: p.status === "VALUATION" ? "ACTIVE" : p.status,
    },
  });
  await db.activity.create({
    data: { type: "NOTE", body: result.message, userId: s.userId, propertyId: id },
  });
  revalidatePath(`/eignir/${id}`);
}

/** Skilar villuboðum (eða null ef tókst). */
export async function generateDescription(id: string): Promise<string | null> {
  const { s, p } = await load(id);
  const { generateListingDescription, claudeConfigured } = await import("@/lib/integrations/claude");
  if (!claudeConfigured()) return "Claude er ekki tengt – settu ANTHROPIC_API_KEY í .env";
  let text: string;
  try {
    text = await generateListingDescription(p);
  } catch (e) {
    return `Ekki tókst að skrifa lýsingu: ${(e as Error).message}`;
  }
  await db.property.update({ where: { id }, data: { description: text } });
  await db.activity.create({
    data: { type: "NOTE", body: "Eignalýsing skrifuð með Claude", userId: s.userId, propertyId: id },
  });
  revalidatePath(`/eignir/${id}`);
  return null;
}
