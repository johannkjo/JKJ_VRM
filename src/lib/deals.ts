import type { Deal } from "@prisma/client";

/** Áætluð þóknun (án vsk) út frá prósentu eða fastri upphæð. */
export function commission(d: Pick<Deal, "value" | "commissionPct" | "commissionFlat">): number | null {
  if (d.commissionFlat) return d.commissionFlat;
  if (d.value && d.commissionPct) return Math.round((d.value * d.commissionPct) / 100);
  return null;
}
