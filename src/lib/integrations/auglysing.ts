// Tenging við auglýsingakerfið auglýsing.app.
//
// ATH: API-skjölun auglýsing.app liggur ekki fyrir enn. Þegar slóð og lykill
// eru stillt (AUGLYSING_API_URL / AUGLYSING_API_KEY) er eignin send sem JSON;
// annars er auglýsingin vistuð sem drög í CRM. Aðlaga þarf `toPayload` og
// svarvinnslu að raunverulegu API-inu.
import type { Property } from "@prisma/client";
import { LISTING, PROPERTY_TYPES, label } from "../constants";

export type PublishResult = { published: boolean; externalId?: string; message: string };

function toPayload(p: Property) {
  return {
    externalRef: p.id,
    title: `${p.address}, ${p.postcode} ${p.city ?? ""}`.trim(),
    listing: p.listing,
    listingLabel: label(LISTING, p.listing),
    type: p.type,
    typeLabel: label(PROPERTY_TYPES, p.type),
    price: p.price,
    size: p.size,
    rooms: p.rooms,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    yearBuilt: p.yearBuilt,
    fastanumer: p.fastanumer,
    fasteignamat: p.fasteignamat,
    description: p.description,
  };
}

export async function publishToAuglysing(p: Property): Promise<PublishResult> {
  const url = process.env.AUGLYSING_API_URL;
  const key = process.env.AUGLYSING_API_KEY;
  if (!url || !key) {
    return { published: false, message: "Auglýsing vistuð sem drög (tenging við auglýsing.app ekki stillt)" };
  }
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/listings${p.adExternalId ? `/${p.adExternalId}` : ""}`, {
      method: p.adExternalId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(toPayload(p)),
    });
    if (!res.ok) return { published: false, message: `auglýsing.app hafnaði beiðni (${res.status})` };
    const json = (await res.json().catch(() => ({}))) as { id?: string };
    return { published: true, externalId: json.id, message: "Auglýsing birt á auglýsing.app" };
  } catch (e) {
    return { published: false, message: `Ekki náðist samband við auglýsing.app: ${(e as Error).message}` };
  }
}
