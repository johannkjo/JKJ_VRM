// Öll leyfð gildi og íslensk heiti þeirra á einum stað.

export const CONTACT_ROLES = {
  BUYER: "Kaupandi",
  SELLER: "Seljandi",
  TENANT: "Leigutaki",
  LANDLORD: "Leigusali",
  PARTNER: "Samstarfsaðili",
} as const;

export const PROPERTY_TYPES = {
  APARTMENT: "Fjölbýli",
  DETACHED: "Einbýli",
  SEMI: "Parhús",
  ROW: "Raðhús",
  SUMMER: "Sumarhús",
  COMMERCIAL: "Atvinnuhúsnæði",
  LAND: "Lóð",
} as const;

export const LISTING = {
  SALE: "Sala",
  RENT: "Leiga",
} as const;

export const PROPERTY_STATUS = {
  VALUATION: "Í verðmati",
  ACTIVE: "Í sölu/leigu",
  RESERVED: "Frátekin",
  SOLD: "Seld",
  RENTED: "Leigð",
  WITHDRAWN: "Tekin úr sölu",
} as const;

export const DEAL_STAGES = {
  LEAD: "Fyrirspurn",
  VALUATION: "Verðmat",
  MANDATE: "Söluumboð",
  MARKETING: "Í auglýsingu",
  OFFER: "Tilboð",
  ACCEPTED: "Samþykkt tilboð",
  CONTRACT: "Kaupsamningur",
  CLOSED: "Afsal / lokið",
  LOST: "Tapað",
} as const;

export const OPEN_STAGES = ["LEAD", "VALUATION", "MANDATE", "MARKETING", "OFFER", "ACCEPTED", "CONTRACT"] as const;

export const OFFER_STATUS = {
  PENDING: "Í skoðun",
  COUNTERED: "Gagntilboð",
  ACCEPTED: "Samþykkt",
  REJECTED: "Hafnað",
  EXPIRED: "Útrunnið",
} as const;

export const ACTIVITY_TYPES = {
  CALL: "Símtal",
  EMAIL: "Tölvupóstur",
  SMS: "SMS",
  MEETING: "Fundur",
  SHOWING: "Sýning",
  NOTE: "Athugasemd",
} as const;

export const SHOWING_KINDS = {
  OPEN_HOUSE: "Opið hús",
  PRIVATE: "Einkasýning",
} as const;

export const AD_STATUS = {
  NONE: "Engin auglýsing",
  DRAFT: "Drög",
  PUBLISHED: "Birt",
} as const;

export const ROLES = {
  ADMIN: "Stjórnandi",
  AGENT: "Fasteignasali",
} as const;

// Sjálfgefinn gátlisti fyrir sölu – búinn til þegar ný sala er stofnuð
export const DEFAULT_SALE_CHECKLIST = [
  "Söluumboð undirritað",
  "Verðmat afhent seljanda",
  "Veðbókarvottorð sótt",
  "Eignaskiptayfirlýsing yfirfarin",
  "Yfirlýsing húsfélags",
  "Ljósmyndir teknar",
  "Söluyfirlit samþykkt af seljanda",
  "Auglýsing birt",
  "Kauptilboð samþykkt",
  "Fyrirvarar uppfylltir",
  "Kaupsamningur undirritaður",
  "Afsal undirritað",
];

export const DEFAULT_RENT_CHECKLIST = [
  "Leiguumboð undirritað",
  "Ljósmyndir teknar",
  "Auglýsing birt",
  "Leigutaki metinn (fjárhagur/meðmæli)",
  "Trygging staðfest",
  "Leigusamningur undirritaður",
  "Úttekt við afhendingu",
];

export type Label<T> = keyof T & string;

export function label<T extends Record<string, string>>(map: T, key: string | null | undefined): string {
  if (!key) return "—";
  return (map as Record<string, string>)[key] ?? key;
}

export function splitList(v: string | null | undefined): string[] {
  return (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}
