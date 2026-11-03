// Einföld skráageymsla á diski (UPLOAD_DIR). Við hýsingu þarf varanlegt drif (volume)
// eða að skipta þessari skrá út fyrir S3/Azure Blob.
import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "./db";

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function dir() {
  return path.resolve(process.env.UPLOAD_DIR || "./uploads");
}

export async function saveFile(file: File): Promise<string> {
  await mkdir(dir(), { recursive: true });
  const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 10);
  const stored = `${randomBytes(16).toString("hex")}${ext}`;
  await writeFile(path.join(dir(), stored), Buffer.from(await file.arrayBuffer()));
  return stored;
}

export async function readStored(stored: string): Promise<Buffer> {
  return readFile(path.join(dir(), path.basename(stored)));
}

export async function removeStored(stored: string) {
  await unlink(path.join(dir(), path.basename(stored))).catch(() => {});
}

/** Eyðir skrám af diski fyrir skjöl tengd tengilið/eign/sölu (áður en færslu er eytt). */
export async function removeFilesFor(where: { contactId?: string; propertyId?: string; dealId?: string }) {
  const docs = await db.document.findMany({ where, select: { storedName: true } });
  await Promise.all(docs.map((d) => removeStored(d.storedName)));
}
