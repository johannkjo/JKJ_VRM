// Sjálfvirk pörun eigna og kaupenda/leigutaka út frá leitarprófíl.
import type { Contact, Property } from "@prisma/client";
import { splitList } from "./constants";

export type MatchResult = { score: number; reasons: string[]; misses: string[] };

/**
 * Ber eign saman við leitarprófíl. Hörð skilyrði (sala/leiga, eignagerð) útiloka;
 * önnur skilyrði gefa stig. Smá svigrúm er gefið á verði (+10%) og stærð (-10%).
 */
export function matchProperty(c: Contact, p: Property): MatchResult | null {
  if (!c.searchActive) return null;
  if (c.searchListing && c.searchListing !== p.listing) return null;

  const types = splitList(c.searchTypes);
  if (types.length && !types.includes(p.type)) return null;

  const reasons: string[] = [];
  const misses: string[] = [];
  let score = 0;
  let max = 0;

  const postcodes = splitList(c.searchPostcodes);
  if (postcodes.length) {
    max += 30;
    if (postcodes.includes(p.postcode)) {
      score += 30;
      reasons.push(`Póstnúmer ${p.postcode}`);
    } else misses.push(`Póstnúmer ${p.postcode}`);
  }

  if (c.searchMaxPrice != null || c.searchMinPrice != null) {
    max += 30;
    if (p.price == null) misses.push("Verð óþekkt");
    else {
      const lo = c.searchMinPrice ?? 0;
      const hi = c.searchMaxPrice ?? Infinity;
      if (p.price >= lo && p.price <= hi) {
        score += 30;
        reasons.push("Innan verðbils");
      } else if (p.price <= hi * 1.1 && p.price >= lo * 0.9) {
        score += 15;
        reasons.push("Nálægt verðbili");
      } else misses.push("Utan verðbils");
    }
  }

  if (c.searchMinSize != null || c.searchMaxSize != null) {
    max += 20;
    if (p.size == null) misses.push("Stærð óþekkt");
    else {
      const lo = c.searchMinSize ?? 0;
      const hi = c.searchMaxSize ?? Infinity;
      if (p.size >= lo && p.size <= hi) {
        score += 20;
        reasons.push(`${p.size.toLocaleString("is-IS")} m²`);
      } else if (p.size >= lo * 0.9 && p.size <= hi * 1.1) {
        score += 10;
        reasons.push("Nálægt stærð");
      } else misses.push("Stærð passar ekki");
    }
  }

  if (c.searchMinRooms != null) {
    max += 20;
    if (p.rooms != null && p.rooms >= c.searchMinRooms) {
      score += 20;
      reasons.push(`${p.rooms} herb.`);
    } else misses.push("Of fá herbergi");
  }

  const pct = max === 0 ? 100 : Math.round((score / max) * 100);
  if (pct < 50) return null;
  return { score: pct, reasons, misses };
}

export function rankMatches<T>(items: { item: T; match: MatchResult | null }[]) {
  return items
    .filter((x): x is { item: T; match: MatchResult } => x.match !== null)
    .sort((a, b) => b.match.score - a.match.score);
}
