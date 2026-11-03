"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { removeFilesFor } from "@/lib/storage";
import { DEAL_STAGES, DEFAULT_RENT_CHECKLIST, DEFAULT_SALE_CHECKLIST, label } from "@/lib/constants";
import { bool, dt, float, int, req, str } from "@/lib/forms";
import { assertCanAccess } from "./guard";

async function load(id: string) {
  const s = await requireUser();
  const d = await db.deal.findUniqueOrThrow({ where: { id }, include: { property: true } });
  assertCanAccess(s, d.agentId);
  return { s, d };
}

function dealData(fd: FormData) {
  return {
    title: req(fd, "title"),
    listing: req(fd, "listing"),
    stage: str(fd, "stage") ?? "LEAD",
    value: int(fd, "value"),
    commissionPct: float(fd, "commissionPct"),
    commissionFlat: int(fd, "commissionFlat"),
    expectedClose: dt(fd, "expectedClose"),
    notes: str(fd, "notes"),
    propertyId: str(fd, "propertyId"),
    buyerId: str(fd, "buyerId"),
    sellerId: str(fd, "sellerId"),
    leaseStart: dt(fd, "leaseStart"),
    leaseEnd: dt(fd, "leaseEnd"),
    leaseMonthlyRent: int(fd, "leaseMonthlyRent"),
    leaseIndexed: bool(fd, "leaseIndexed"),
    leaseIndexBase: str(fd, "leaseIndexBase"),
    leaseNoticeMonths: int(fd, "leaseNoticeMonths"),
  };
}

/** Býr til áminningar um endurnýjun og lok leigusamnings. */
async function createLeaseReminders(d: { id: string; title: string; agentId: string; leaseEnd: Date | null; leaseNoticeMonths: number | null; sellerId: string | null; propertyId: string | null }) {
  if (!d.leaseEnd) return;
  const existing = await db.task.count({ where: { dealId: d.id, title: { startsWith: "Leigusamningur" } } });
  if (existing > 0) return;
  const notice = new Date(d.leaseEnd);
  notice.setUTCMonth(notice.getUTCMonth() - (d.leaseNoticeMonths ?? 6));
  notice.setUTCHours(10, 0, 0, 0);
  const base = { userId: d.agentId, dealId: d.id, contactId: d.sellerId, propertyId: d.propertyId, priority: 1 };
  await db.task.createMany({
    data: [
      { ...base, title: `Leigusamningur: ræða endurnýjun við leigusala og leigutaka – ${d.title}`, dueAt: notice },
      { ...base, title: `Leigusamningur rennur út – ${d.title}`, dueAt: d.leaseEnd },
    ],
  });
}

export async function createDeal(fd: FormData) {
  const s = await requireUser();
  const data = dealData(fd);
  const items = data.listing === "RENT" ? DEFAULT_RENT_CHECKLIST : DEFAULT_SALE_CHECKLIST;
  const d = await db.deal.create({
    data: {
      ...data,
      agentId: s.userId,
      checklist: { create: items.map((label, order) => ({ label, order })) },
    },
  });
  revalidatePath("/solur");
  redirect(`/solur/${d.id}`);
}

export async function updateDeal(id: string, fd: FormData) {
  await load(id);
  const updated = await db.deal.update({ where: { id }, data: dealData(fd) });
  if (updated.stage === "CLOSED" && updated.listing === "RENT") await createLeaseReminders(updated);
  revalidatePath(`/solur/${id}`);
  redirect(`/solur/${id}`);
}

/** Færir sölu milli stiga og uppfærir stöðu eignar í samræmi. */
export async function moveDeal(id: string, stage: string) {
  const { s, d } = await load(id);
  if (d.stage === stage) return;
  await db.deal.update({ where: { id }, data: { stage } });
  if (stage === "CLOSED" && d.listing === "RENT") await createLeaseReminders(d);
  if (d.propertyId) {
    const map: Record<string, string> = {
      MARKETING: "ACTIVE",
      ACCEPTED: "RESERVED",
      CONTRACT: "RESERVED",
      CLOSED: d.listing === "RENT" ? "RENTED" : "SOLD",
    };
    if (map[stage]) await db.property.update({ where: { id: d.propertyId }, data: { status: map[stage] } });
  }
  await db.activity.create({
    data: {
      type: "NOTE",
      body: `Stig fært: ${label(DEAL_STAGES, d.stage)} → ${label(DEAL_STAGES, stage)}`,
      userId: s.userId,
      dealId: id,
    },
  });
  revalidatePath("/solur");
  revalidatePath(`/solur/${id}`);
  revalidatePath("/");
}

export async function deleteDeal(id: string) {
  await load(id);
  await removeFilesFor({ dealId: id });
  await db.deal.delete({ where: { id } });
  revalidatePath("/solur");
  redirect("/solur");
}

export async function toggleChecklist(itemId: string) {
  const item = await db.checklistItem.findUniqueOrThrow({ where: { id: itemId } });
  await load(item.dealId);
  await db.checklistItem.update({ where: { id: itemId }, data: { done: !item.done } });
  revalidatePath(`/solur/${item.dealId}`);
}

export async function addChecklistItem(dealId: string, fd: FormData) {
  await load(dealId);
  const count = await db.checklistItem.count({ where: { dealId } });
  await db.checklistItem.create({ data: { dealId, label: req(fd, "label"), order: count } });
  revalidatePath(`/solur/${dealId}`);
}

export async function addOffer(dealId: string, fd: FormData) {
  const { s, d } = await load(dealId);
  const amount = int(fd, "amount");
  if (!amount) throw new Error("Upphæð vantar");
  await db.offer.create({
    data: {
      dealId,
      amount,
      conditions: str(fd, "conditions"),
      expiresAt: dt(fd, "expiresAt"),
      bidderId: str(fd, "bidderId"),
    },
  });
  if (["LEAD", "VALUATION", "MANDATE", "MARKETING"].includes(d.stage)) {
    await db.deal.update({ where: { id: dealId }, data: { stage: "OFFER" } });
  }
  const expires = dt(fd, "expiresAt");
  if (expires) {
    await db.task.create({
      data: { title: `Tilboð rennur út (${d.title})`, dueAt: expires, priority: 1, userId: s.userId, dealId },
    });
  }
  revalidatePath(`/solur/${dealId}`);
  revalidatePath("/solur");
}

export async function setOfferStatus(offerId: string, status: string) {
  const o = await db.offer.findUniqueOrThrow({ where: { id: offerId } });
  await load(o.dealId);
  await db.offer.update({ where: { id: offerId }, data: { status } });
  if (status === "ACCEPTED") {
    await db.deal.update({
      where: { id: o.dealId },
      data: { value: o.amount, ...(o.bidderId ? { buyerId: o.bidderId } : {}) },
    });
    await moveDeal(o.dealId, "ACCEPTED");
  }
  revalidatePath(`/solur/${o.dealId}`);
}
