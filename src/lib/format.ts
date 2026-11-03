const nf = new Intl.NumberFormat("is-IS");

export function kr(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${nf.format(n)} kr.`;
}

export function mkr(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${(n / 1_000_000).toLocaleString("is-IS", { maximumFractionDigits: 1 })} m.kr.`;
}

export function num(n: number | null | undefined, suffix = ""): string {
  if (n == null) return "—";
  return `${nf.format(n)}${suffix}`;
}

const TZ = "Atlantic/Reykjavik";

export function date(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString("is-IS", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
}

export function dateTime(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleString("is-IS", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

/** Gildi fyrir <input type="datetime-local"> (Ísland er alltaf UTC) */
export function toInputDateTime(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 16);
}

export function toInputDate(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}
