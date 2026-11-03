import type { Property } from "@prisma/client";
import { LISTING, PROPERTY_STATUS, PROPERTY_TYPES } from "@/lib/constants";
import { Submit } from "./Buttons";
import { Area, Check, Select, Text } from "./Fields";

export default function PropertyForm({ action, p, sellers }: {
  action: (fd: FormData) => Promise<void>;
  p?: Property;
  sellers: { id: string; name: string }[];
}) {
  return (
    <form action={action} className="space-y-4">
      <section className="card grid gap-3 sm:grid-cols-4">
        <Text name="address" label="Heimilisfang" defaultValue={p?.address} required className="sm:col-span-2" />
        <Text name="postcode" label="Póstnúmer" inputMode="numeric" defaultValue={p?.postcode} required />
        <Text name="city" label="Staður" defaultValue={p?.city} />
        <Select name="listing" label="Sala / leiga" options={LISTING} defaultValue={p?.listing ?? "SALE"} required />
        <Select name="type" label="Tegund" options={PROPERTY_TYPES} defaultValue={p?.type ?? "APARTMENT"} required />
        <Select name="status" label="Staða" options={PROPERTY_STATUS} defaultValue={p?.status ?? "VALUATION"} />
        <Text name="fastanumer" label="Fastanúmer" defaultValue={p?.fastanumer} />
        <Text name="listingUrl" label="Slóð á eignina á fasteignavef (fyrir auglýsing.app)" type="url" placeholder="https://www.remax.is/…" defaultValue={p?.listingUrl} className="sm:col-span-4" />
        <div className="sm:col-span-4">
          <label className="lbl" htmlFor="sellerId">Seljandi / leigusali</label>
          <select id="sellerId" name="sellerId" className="input" defaultValue={p?.sellerId ?? ""}>
            <option value="">— Enginn valinn —</option>
            {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </section>

      <section className="card grid gap-3 sm:grid-cols-4">
        <Text name="price" label="Verð / mánaðarleiga (kr.)" inputMode="numeric" defaultValue={p?.price} />
        <Text name="size" label="Stærð (m²)" inputMode="decimal" defaultValue={p?.size} />
        <Text name="rooms" label="Herbergi" inputMode="numeric" defaultValue={p?.rooms} />
        <Text name="bedrooms" label="Svefnherbergi" inputMode="numeric" defaultValue={p?.bedrooms} />
        <Text name="bathrooms" label="Baðherbergi" inputMode="numeric" defaultValue={p?.bathrooms} />
        <Text name="yearBuilt" label="Byggingarár" inputMode="numeric" defaultValue={p?.yearBuilt} />
        <Text name="fasteignamat" label="Fasteignamat (kr.)" inputMode="numeric" defaultValue={p?.fasteignamat} />
        <Text name="brunabotamat" label="Brunabótamat (kr.)" inputMode="numeric" defaultValue={p?.brunabotamat} />
        <div className="flex gap-4 sm:col-span-4">
          <Check name="garage" label="Bílskúr / stæði" defaultChecked={p?.garage} />
          <Check name="elevator" label="Lyfta" defaultChecked={p?.elevator} />
        </div>
      </section>

      <section className="card space-y-3">
        <Area name="features" label="Helstu kostir (stikkorð fyrir lýsingu)" defaultValue={p?.features} rows={2} />
        <Area name="description" label="Eignalýsing" defaultValue={p?.description} rows={8} />
      </section>

      <Submit>Vista eign</Submit>
    </form>
  );
}
