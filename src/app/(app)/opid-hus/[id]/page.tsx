import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmSubmit, Submit } from "@/components/Buttons";
import { ownerScope, requireUser } from "@/lib/auth";
import { SHOWING_KINDS, label } from "@/lib/constants";
import { dateTime, kr } from "@/lib/format";
import { db } from "@/lib/db";
import { deleteShowing, registerAttendee } from "../../_actions/showings";

/** Gestaskráning á opnu húsi – hönnuð til notkunar í síma á staðnum. */
export default async function OpenHousePage({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireUser();
  const { id } = await params;
  const sh = await db.showing.findFirst({
    where: { id, property: ownerScope(s, "agentId") },
    include: { property: true, attendees: { include: { contact: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!sh) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <Link href={`/eignir/${sh.propertyId}`} className="muted">← {sh.property.address}</Link>
        <h1 className="h1">{label(SHOWING_KINDS, sh.kind)}</h1>
        <p className="muted">{sh.property.address} · {dateTime(sh.startsAt)} · {kr(sh.property.price)}</p>
      </div>

      <form action={registerAttendee.bind(null, id)} className="card space-y-3">
        <h2 className="h2">Skrá gest</h2>
        <input name="name" className="input" placeholder="Nafn *" required autoComplete="off" />
        <input name="phone" type="tel" inputMode="tel" className="input" placeholder="Sími" autoComplete="off" />
        <input name="email" type="email" className="input" placeholder="Netfang" autoComplete="off" />
        <fieldset>
          <legend className="lbl">Áhugi</legend>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 py-3 text-lg has-[:checked]:border-brand-500 has-[:checked]:bg-brand-500 has-[:checked]:text-white">
                <input type="radio" name="interest" value={n} className="sr-only" />
                {n}
              </label>
            ))}
          </div>
        </fieldset>
        <textarea name="feedback" className="input" rows={2} placeholder="Athugasemdir / viðbrögð" />
        <Submit className="btn w-full py-3 text-base" pendingText="Skrái…">Skrá gest</Submit>
        <p className="text-xs text-slate-500">Gestir eru sjálfkrafa skráðir sem tengiliðir. Þeir sem gefa 4–5 í áhuga fá eftirfylgniverkefni næsta dag.</p>
      </form>

      <section className="card">
        <h2 className="h2">Gestir ({sh.attendees.length})</h2>
        <ul className="divide-y divide-slate-100 text-sm">
          {sh.attendees.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 py-2">
              <div>
                <Link href={`/tengilidir/${a.contactId}`} className="link font-medium">{a.contact.name}</Link>
                <p className="text-xs text-slate-500">{a.contact.phone ?? a.contact.email ?? ""}{a.feedback && ` · ${a.feedback}`}</p>
              </div>
              {a.interest && <span className="badge">{a.interest}/5</span>}
            </li>
          ))}
        </ul>
      </section>

      <form action={deleteShowing.bind(null, id)}>
        <ConfirmSubmit message="Eyða þessari sýningu og gestaskráningu?">Eyða sýningu</ConfirmSubmit>
      </form>
    </div>
  );
}
