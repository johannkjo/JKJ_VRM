import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { readStored } from "@/lib/storage";

// Afhendir skjal eingöngu ef notandi hefur aðgang að tengdri færslu.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireUser();
  const { id } = await params;
  const d = await db.document.findUnique({
    where: { id },
    include: { property: { select: { agentId: true } }, deal: { select: { agentId: true } }, contact: { select: { ownerId: true } } },
  });
  if (!d) return new NextResponse("Fannst ekki", { status: 404 });
  const owner = d.property?.agentId ?? d.deal?.agentId ?? d.contact?.ownerId;
  if (s.role !== "ADMIN" && owner !== s.userId) return new NextResponse("Aðgangi hafnað", { status: 403 });
  const data = await readStored(d.storedName).catch(() => null);
  if (!data) return new NextResponse("Skrá vantar á diski", { status: 404 });
  const inline = d.mime.startsWith("image/") || d.mime === "application/pdf";
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": d.mime,
      "Content-Length": String(data.length),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(d.name)}`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
