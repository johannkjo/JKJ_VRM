"use server";

import { requireUser } from "@/lib/auth";
import { ACTIVITY_TYPES, CONTACT_ROLES, DEAL_STAGES, label, splitList } from "@/lib/constants";
import { db } from "@/lib/db";
import { claudeConfigured, draftEmail, summarizeContact } from "@/lib/integrations/claude";
import { assertCanAccess } from "./guard";

const NOT_CONFIGURED = "Claude er ekki tengt – settu ANTHROPIC_API_KEY í .env";

/** Safnar saman gögnum um tengilið sem texta fyrir Claude. */
async function contactContext(contactId: string) {
  const s = await requireUser();
  const c = await db.contact.findUniqueOrThrow({
    where: { id: contactId },
    include: {
      activities: { orderBy: { occurredAt: "desc" }, take: 25 },
      tasks: { where: { done: false } },
      dealsAsBuyer: { include: { property: true } },
      dealsAsSeller: { include: { property: true } },
      attendances: { include: { showing: { include: { property: true } } } },
    },
  });
  assertCanAccess(s, c.ownerId);
  const lines = [
    `Fasteignasali: ${s.name}`,
    `Dagsetning í dag: ${new Date().toISOString().slice(0, 10)}`,
    `Viðskiptavinur: ${c.name}${c.company ? ` (${c.company})` : ""}`,
    `Hlutverk: ${splitList(c.roles).map((r) => label(CONTACT_ROLES, r)).join(", ") || "óskráð"}`,
    c.source && `Uppruni: ${c.source}`,
    c.notes && `Athugasemdir: ${c.notes}`,
    c.searchActive &&
      `Leitar að: ${c.searchListing ?? "kaup/leiga"}, póstnr. ${c.searchPostcodes ?? "öll"}, verð ${c.searchMinPrice ?? "?"}–${c.searchMaxPrice ?? "?"} kr., ` +
        `${c.searchMinSize ?? "?"}–${c.searchMaxSize ?? "?"} m², ${c.searchMinRooms ?? "?"}+ herb. ${c.searchNotes ?? ""}`,
    ...[...c.dealsAsBuyer, ...c.dealsAsSeller].map((d) => `Sala: ${d.title} – stig: ${label(DEAL_STAGES, d.stage)}${d.property ? ` – ${d.property.address}` : ""}`),
    ...c.attendances.map((a) => `Mætti á sýningu: ${a.showing.property.address} ${a.showing.startsAt.toISOString().slice(0, 10)}${a.interest ? `, áhugi ${a.interest}/5` : ""}${a.feedback ? `, ${a.feedback}` : ""}`),
    ...c.tasks.map((t) => `Opið verkefni: ${t.title}${t.dueAt ? ` (${t.dueAt.toISOString().slice(0, 10)})` : ""}`),
    "Samskiptasaga (nýjast fyrst):",
    ...c.activities.map((a) => `- ${a.occurredAt.toISOString().slice(0, 10)} ${label(ACTIVITY_TYPES, a.type)}: ${a.body.slice(0, 400)}`),
  ];
  return lines.filter(Boolean).join("\n");
}

export async function aiSummarizeContact(contactId: string): Promise<{ text?: string; error?: string }> {
  if (!claudeConfigured()) return { error: NOT_CONFIGURED };
  try {
    return { text: await summarizeContact(await contactContext(contactId)) };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function aiDraftEmail(contactId: string, purpose: string): Promise<{ subject?: string; body?: string; error?: string }> {
  if (!claudeConfigured()) return { error: NOT_CONFIGURED };
  try {
    return await draftEmail(await contactContext(contactId), purpose);
  } catch (e) {
    return { error: (e as Error).message };
  }
}
