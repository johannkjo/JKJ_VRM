import type { Deal } from "@prisma/client";
import { DEAL_STAGES, LISTING } from "@/lib/constants";
import { toInputDate } from "@/lib/format";
import { Submit } from "./Buttons";
import { Area, Select, Text } from "./Fields";

type Opt = { id: string; name: string };

export default function DealForm({ action, d, contacts, properties, defaults }: {
  action: (fd: FormData) => Promise<void>;
  d?: Deal;
  contacts: Opt[];
  properties: { id: string; address: string; listing: string; price: number | null; sellerId: string | null }[];
  defaults?: { propertyId?: string };
}) {
  const prop = properties.find((p) => p.id === (d?.propertyId ?? defaults?.propertyId));
  const pick = (name: string, lbl: string, value?: string | null) => (
    <div>
      <label className="lbl" htmlFor={name}>{lbl}</label>
      <select id={name} name={name} className="input" defaultValue={value ?? ""}>
        <option value="">— Enginn —</option>
        {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
  );
  return (
    <form action={action} className="space-y-4">
      <section className="card grid gap-3 sm:grid-cols-2">
        <Text name="title" label="Heiti" required defaultValue={d?.title ?? (prop ? prop.address : "")} className="sm:col-span-2" />
        <Select name="listing" label="Sala / leiga" options={LISTING} defaultValue={d?.listing ?? prop?.listing ?? "SALE"} />
        <Select name="stage" label="Stig" options={DEAL_STAGES} defaultValue={d?.stage ?? "LEAD"} />
        <div className="sm:col-span-2">
          <label className="lbl" htmlFor="propertyId">Eign</label>
          <select id="propertyId" name="propertyId" className="input" defaultValue={d?.propertyId ?? defaults?.propertyId ?? ""}>
            <option value="">— Engin eign (t.d. verðmat á eftir) —</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.address}</option>)}
          </select>
        </div>
        {pick("sellerId", "Seljandi / leigusali", d?.sellerId ?? prop?.sellerId)}
        {pick("buyerId", "Kaupandi / leigutaki", d?.buyerId)}
        <Text name="value" label="Áætlað verð / ársleiga (kr.)" inputMode="numeric" defaultValue={d?.value ?? prop?.price} />
        <Text name="expectedClose" label="Áætluð lok" type="date" defaultValue={toInputDate(d?.expectedClose)} />
        <Text name="commissionPct" label="Söluþóknun (%)" inputMode="decimal" defaultValue={d?.commissionPct} placeholder="t.d. 1,95" />
        <Text name="commissionFlat" label="eða föst þóknun (kr.)" inputMode="numeric" defaultValue={d?.commissionFlat} />
        <Area name="notes" label="Athugasemdir" defaultValue={d?.notes} className="sm:col-span-2" />
      </section>
      <Submit>Vista</Submit>
    </form>
  );
}
