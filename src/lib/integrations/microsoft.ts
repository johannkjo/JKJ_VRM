// Tenging við Microsoft 365 (Outlook dagatal og póstur) í gegnum Microsoft Graph.
// Hver notandi tengir sinn eigin reikning (OAuth 2.0 authorization code flow).
import "server-only";
import { db } from "../db";
import { decrypt, encrypt } from "../crypto";

const SCOPES = ["openid", "profile", "offline_access", "User.Read", "Calendars.ReadWrite", "Mail.Read", "Mail.Send"];
const GRAPH = "https://graph.microsoft.com/v1.0";

export function msConfigured() {
  return Boolean(process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET);
}

function tenant() {
  return process.env.MS_TENANT_ID || "organizations";
}

export function appUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function redirectUri() {
  return `${appUrl()}/api/microsoft/callback`;
}

export function authorizeUrl(state: string) {
  const u = new URL(`https://login.microsoftonline.com/${tenant()}/oauth2/v2.0/authorize`);
  u.searchParams.set("client_id", process.env.MS_CLIENT_ID!);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("redirect_uri", redirectUri());
  u.searchParams.set("response_mode", "query");
  u.searchParams.set("scope", SCOPES.join(" "));
  u.searchParams.set("state", state);
  u.searchParams.set("prompt", "select_account");
  return u.toString();
}

type TokenResponse = { access_token: string; refresh_token?: string; expires_in: number; error_description?: string };

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`https://login.microsoftonline.com/${tenant()}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MS_CLIENT_ID!,
      client_secret: process.env.MS_CLIENT_SECRET!,
      scope: SCOPES.join(" "),
      ...params,
    }),
  });
  const json = (await res.json()) as TokenResponse;
  if (!res.ok) throw new Error(json.error_description ?? `Microsoft innskráning mistókst (${res.status})`);
  return json;
}

/** Skiptir kóða út fyrir tóka og vistar tenginguna á notandann. */
export async function connectAccount(userId: string, code: string) {
  const t = await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirectUri() });
  if (!t.refresh_token) throw new Error("Microsoft skilaði ekki endurnýjunartóka (offline_access)");
  const me = await fetch(`${GRAPH}/me?$select=mail,userPrincipalName`, { headers: { Authorization: `Bearer ${t.access_token}` } }).then(
    (r) => r.json() as Promise<{ mail?: string; userPrincipalName?: string }>,
  );
  const data = {
    email: me.mail ?? me.userPrincipalName ?? "",
    accessToken: encrypt(t.access_token),
    refreshToken: encrypt(t.refresh_token),
    expiresAt: new Date(Date.now() + (t.expires_in - 60) * 1000),
  };
  await db.msAccount.upsert({ where: { userId }, create: { userId, ...data }, update: data });
}

async function accessToken(userId: string): Promise<string | null> {
  if (!msConfigured()) return null;
  const acc = await db.msAccount.findUnique({ where: { userId } });
  if (!acc) return null;
  if (acc.expiresAt > new Date()) return decrypt(acc.accessToken);
  try {
    const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: decrypt(acc.refreshToken) });
    await db.msAccount.update({
      where: { userId },
      data: {
        accessToken: encrypt(t.access_token),
        ...(t.refresh_token ? { refreshToken: encrypt(t.refresh_token) } : {}),
        expiresAt: new Date(Date.now() + (t.expires_in - 60) * 1000),
      },
    });
    return t.access_token;
  } catch (e) {
    console.error("Microsoft token refresh failed", e);
    return null;
  }
}

/** Kallar á Graph. Skilar null ef notandi er ekki tengdur. */
async function graph<T>(userId: string, path: string, init: RequestInit = {}): Promise<T | null> {
  const token = await accessToken(userId);
  if (!token) return null;
  const res = await fetch(`${GRAPH}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: 'outlook.timezone="UTC"', ...init.headers },
    cache: "no-store",
  });
  if (res.status === 204 || res.status === 202) return {} as T;
  if (!res.ok) throw new Error(`Microsoft Graph villa ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

// ---------- Dagatal ----------

export type OutlookEvent = { id: string; subject: string; start: Date; end: Date; location: string | null; webLink: string };

type GraphEvent = { id: string; subject: string; start: { dateTime: string }; end: { dateTime: string }; location?: { displayName?: string }; webLink: string };

export async function listEvents(userId: string, from: Date, to: Date): Promise<OutlookEvent[] | null> {
  const q = `startDateTime=${from.toISOString()}&endDateTime=${to.toISOString()}&$top=200&$orderby=start/dateTime&$select=id,subject,start,end,location,webLink`;
  const r = await graph<{ value: GraphEvent[] }>(userId, `/me/calendarView?${q}`);
  if (!r) return null;
  return r.value.map((e) => ({
    id: e.id,
    subject: e.subject,
    start: new Date(`${e.start.dateTime}Z`),
    end: new Date(`${e.end.dateTime}Z`),
    location: e.location?.displayName || null,
    webLink: e.webLink,
  }));
}

export async function createEvent(
  userId: string,
  ev: { subject: string; start: Date; end: Date; location?: string; body?: string },
): Promise<string | null> {
  const r = await graph<{ id: string }>(userId, "/me/events", {
    method: "POST",
    body: JSON.stringify({
      subject: ev.subject,
      start: { dateTime: ev.start.toISOString().slice(0, 19), timeZone: "UTC" },
      end: { dateTime: ev.end.toISOString().slice(0, 19), timeZone: "UTC" },
      location: ev.location ? { displayName: ev.location } : undefined,
      body: ev.body ? { contentType: "HTML", content: ev.body } : undefined,
      reminderMinutesBeforeStart: 60,
    }),
  });
  return r?.id ?? null;
}

export async function deleteEvent(userId: string, eventId: string) {
  await graph(userId, `/me/events/${encodeURIComponent(eventId)}`, { method: "DELETE" });
}

// ---------- Póstur ----------

export type OutlookMessage = { id: string; subject: string; from: string; to: string[]; received: Date; preview: string; webLink: string; outgoing: boolean };

type GraphMessage = {
  id: string;
  subject: string | null;
  from?: { emailAddress: { address: string; name: string } };
  toRecipients: { emailAddress: { address: string } }[];
  receivedDateTime: string;
  bodyPreview: string;
  webLink: string;
};

/** Nýlegir póstar til eða frá netfangi. */
export async function messagesWith(userId: string, email: string): Promise<OutlookMessage[] | null> {
  const safe = email.replace(/["\\]/g, "");
  const q = `$search="${encodeURIComponent(`participants:${safe}`)}"&$top=15&$select=id,subject,from,toRecipients,receivedDateTime,bodyPreview,webLink`;
  const r = await graph<{ value: GraphMessage[] }>(userId, `/me/messages?${q}`);
  if (!r) return null;
  return r.value
    .map((m) => ({
      id: m.id,
      subject: m.subject ?? "(ekkert efni)",
      from: m.from?.emailAddress.name || m.from?.emailAddress.address || "",
      to: m.toRecipients.map((t) => t.emailAddress.address),
      received: new Date(m.receivedDateTime),
      preview: m.bodyPreview,
      webLink: m.webLink,
      outgoing: (m.from?.emailAddress.address ?? "").toLowerCase() !== email.toLowerCase(),
    }))
    .sort((a, b) => b.received.getTime() - a.received.getTime());
}

export async function sendMail(userId: string, to: string, subject: string, body: string) {
  const r = await graph(userId, "/me/sendMail", {
    method: "POST",
    body: JSON.stringify({
      message: { subject, body: { contentType: "Text", content: body }, toRecipients: [{ emailAddress: { address: to } }] },
      saveToSentItems: true,
    }),
  });
  if (r === null) throw new Error("Microsoft 365 er ekki tengt");
}
