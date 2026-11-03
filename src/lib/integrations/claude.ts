// Claude: skrifar söluvæna eignalýsingu á íslensku út frá skráðum gögnum.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Property } from "@prisma/client";
import { LISTING, PROPERTY_TYPES, label } from "../constants";

const SYSTEM = `Þú ert reyndur íslenskur fasteignasali sem skrifar auglýsingatexta.
Skrifaðu á vandaðri, eðlilegri íslensku. Textinn á að vera hlýlegur en faglegur,
3–5 stuttar efnisgreinar, án ýkja og án upplýsinga sem ekki koma fram í gögnunum.
Byrjaðu á grípandi inngangssetningu. Ekki nota fyrirsagnir, markdown eða emoji.
Ef um atvinnuhúsnæði til leigu er að ræða, leggðu áherslu á nýtingarmöguleika, staðsetningu og aðgengi.`;

function facts(p: Property): string {
  const rows: [string, unknown][] = [
    ["Heimilisfang", `${p.address}, ${p.postcode} ${p.city ?? ""}`],
    ["Tegund", label(PROPERTY_TYPES, p.type)],
    ["Sala eða leiga", label(LISTING, p.listing)],
    ["Stærð (m²)", p.size],
    ["Herbergi", p.rooms],
    ["Svefnherbergi", p.bedrooms],
    ["Baðherbergi", p.bathrooms],
    ["Byggingarár", p.yearBuilt],
    ["Bílskúr", p.garage ? "Já" : null],
    ["Lyfta", p.elevator ? "Já" : null],
    ["Helstu kostir / athugasemdir", p.features],
    ["Núverandi lýsing (drög)", p.description],
  ];
  return rows
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

export function claudeConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Ein köll á Claude; skilar texta svarsins. */
async function ask(system: string, prompt: string, format?: Anthropic.Beta.BetaJSONOutputFormat): Promise<string> {
  const client = new Anthropic();
  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    output_config: { effort: "medium", ...(format ? { format } : {}) },
    // Ef Claude hafnar beiðni (öryggissía) er hún sjálfkrafa keyrð á öðru líkani
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude gat ekki svarað þessari beiðni");
  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("Claude skilaði tómu svari");
  return text;
}

export async function generateListingDescription(p: Property): Promise<string> {
  return ask(SYSTEM, `Skrifaðu auglýsingatexta fyrir eftirfarandi eign:\n\n${facts(p)}`);
}

const ASSISTANT = `Þú ert aðstoðarmaður íslensks fasteignasala. Skrifaðu á vandaðri, eðlilegri íslensku.
Byggðu eingöngu á þeim gögnum sem fylgja; ekki búa til staðreyndir, verð eða dagsetningar.`;

/** Stutt samantekt á stöðu viðskiptavinar og tillögur að næstu skrefum. */
export async function summarizeContact(context: string): Promise<string> {
  return ask(
    ASSISTANT,
    `Hér eru gögn um viðskiptavin úr CRM-kerfinu. Skrifaðu stutta samantekt (3–5 punktar með „• “) um stöðuna og ` +
      `síðan 1–3 tillögur að næstu skrefum (með „→ “). Engar fyrirsagnir eða markdown.\n\n${context}`,
  );
}

/** Drög að tölvupósti til viðskiptavinar. */
export async function draftEmail(context: string, purpose: string): Promise<{ subject: string; body: string }> {
  const json = await ask(
    `${ASSISTANT}\nTölvupóstar eru kurteisir, persónulegir og hnitmiðaðir, í þéringalausum íslenskum stíl, ` +
      `og enda á kveðju frá fasteignasalanum (nafn kemur fram í gögnunum).`,
    `Skrifaðu drög að tölvupósti til viðskiptavinarins.\nTilgangur: ${purpose || "eftirfylgni"}\n\nGögn:\n${context}`,
    {
      type: "json_schema",
      schema: {
        type: "object",
        properties: { subject: { type: "string" }, body: { type: "string" } },
        required: ["subject", "body"],
        additionalProperties: false,
      },
    },
  );
  const parsed = JSON.parse(json) as { subject: string; body: string };
  return parsed;
}
