import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { appUrl, connectAccount } from "@/lib/integrations/microsoft";

export async function GET(req: NextRequest) {
  const s = await requireUser();
  const jar = await cookies();
  const expected = jar.get("ms_oauth_state")?.value;
  jar.delete("ms_oauth_state");
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const back = new URL("/notendur", appUrl());
  if (!code || !state || state !== expected) {
    back.searchParams.set("ms", req.nextUrl.searchParams.get("error_description") ?? "Tenging við Microsoft mistókst");
    return NextResponse.redirect(back);
  }
  try {
    await connectAccount(s.userId, code);
    back.searchParams.set("ms", "ok");
  } catch (e) {
    back.searchParams.set("ms", (e as Error).message);
  }
  return NextResponse.redirect(back);
}
