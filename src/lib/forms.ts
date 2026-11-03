// Hjálparföll til að lesa gildi úr FormData í server actions.

export function str(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export function req(fd: FormData, k: string): string {
  const v = str(fd, k);
  if (!v) throw new Error(`Reitur vantar: ${k}`);
  return v;
}

/** Heiltala; leyfir bil og punkta sem þúsundaskil („45.900.000“). */
export function int(fd: FormData, k: string): number | null {
  const v = str(fd, k);
  if (!v) return null;
  const n = parseInt(v.replace(/[\s.]/g, "").replace(",", "."), 10);
  return Number.isFinite(n) ? n : null;
}

export function float(fd: FormData, k: string): number | null {
  const v = str(fd, k);
  if (!v) return null;
  const n = parseFloat(v.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function bool(fd: FormData, k: string): boolean {
  return fd.get(k) === "on" || fd.get(k) === "true";
}

export function list(fd: FormData, k: string): string | null {
  const vals = fd.getAll(k).filter((v): v is string => typeof v === "string" && v !== "");
  return vals.length ? vals.join(",") : null;
}

/** Ísland er á UTC allt árið, svo datetime-local gildi eru túlkuð sem UTC. */
export function dt(fd: FormData, k: string): Date | null {
  const v = str(fd, k);
  if (!v) return null;
  const iso = v.length === 10 ? `${v}T12:00:00Z` : v.length === 16 ? `${v}:00Z` : v;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}
