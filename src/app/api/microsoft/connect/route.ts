import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { authorizeUrl, msConfigured } from "@/lib/integrations/microsoft";

export async function GET() {
  await requireUser();
  if (!msConfigured()) return NextResponse.json({ error: "Microsoft 365 er ekki stillt (MS_CLIENT_ID/MS_CLIENT_SECRET)" }, { status: 400 });
  const state = randomBytes(16).toString("hex");
  (await cookies()).set("ms_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  return NextResponse.redirect(authorizeUrl(state));
}
