// Létt lotumeðhöndlun sem virkar bæði í middleware (edge) og á þjóni.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "crm_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dagar

export type Session = { userId: string; role: "ADMIN" | "AGENT"; name: string };

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) throw new Error("AUTH_SECRET vantar eða er of stuttur");
  return new TextEncoder().encode(secret);
}

export async function signSession(s: Session): Promise<string> {
  return new SignJWT(s)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return { userId: payload.userId as string, role: payload.role as Session["role"], name: payload.name as string };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};
