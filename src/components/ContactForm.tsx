import type { Contact } from "@prisma/client";
import { CONTACT_ROLES, LISTING, PROPERTY_TYPES, splitList } from "@/lib/constants";
import { Submit } from "./Buttons";
import { Area, Check, Checks, Select, Text } from "./Fields";

export default function ContactForm({ action, c }: { action: (fd: FormData) => Promise<void>; c?: Contact }) {
  return (
    <form action={action} className="space-y-4">
      <section className="card grid gap-3 sm:grid-cols-2">
        <Text name="name" label="Nafn" defaultValue={c?.name} required className="sm:col-span-2" />
        <Text name="phone" label="Sími" type="tel" inputMode="tel" defaultValue={c?.phone} />
        <Text name="email" label="Netfang" type="email" defaultValue={c?.email} />
        <Text name="kennitala" label="Kennitala" inputMode="numeric" defaultValue={c?.kennitala} />
        <Text name="company" label="Fyrirtæki" defaultValue={c?.company} />
        <Text name="source" label="Hvaðan kom tengiliður?" placeholder="t.d. opið hús, meðmæli, vefur" defaultValue={c?.source} className="sm:col-span-2" />
        <div className="sm:col-span-2">
          <Checks name="roles" label="Hlutverk" options={CONTACT_ROLES} selected={splitList(c?.roles)} />
        </div>
        <Area name="notes" label="Athugasemdir" defaultValue={c?.notes} className="sm:col-span-2" />
      </section>

      <section className="card space-y-3">
        <div>
          <h2 className="h2 mb-1">Leitarprófíll</h2>
          <p className="muted">Fylltu út ef tengiliðurinn er að leita að eign. Kerfið lætur þig vita þegar eign passar.</p>
        </div>
        <Check name="searchActive" label="Er virkur í leit" defaultChecked={c?.searchActive} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select name="searchListing" label="Kaupa eða leigja" options={LISTING} empty="Hvort tveggja" defaultValue={c?.searchListing} />
          <Text name="searchPostcodes" label="Póstnúmer (kommuaðskilin)" placeholder="101,105,107" defaultValue={c?.searchPostcodes} />
          <Text name="searchMinPrice" label="Verð frá (kr.)" inputMode="numeric" defaultValue={c?.searchMinPrice} />
          <Text name="searchMaxPrice" label="Verð til (kr.)" inputMode="numeric" defaultValue={c?.searchMaxPrice} />
          <Text name="searchMinSize" label="Stærð frá (m²)" inputMode="decimal" defaultValue={c?.searchMinSize} />
          <Text name="searchMaxSize" label="Stærð til (m²)" inputMode="decimal" defaultValue={c?.searchMaxSize} />
          <Text name="searchMinRooms" label="Lágmark herbergja" inputMode="numeric" defaultValue={c?.searchMinRooms} />
        </div>
        <Checks name="searchTypes" label="Eignagerðir (tómt = allar)" options={PROPERTY_TYPES} selected={splitList(c?.searchTypes)} />
        <Area name="searchNotes" label="Aðrar óskir" defaultValue={c?.searchNotes} rows={2} />
      </section>

      <Submit>Vista tengilið</Submit>
    </form>
  );
}
