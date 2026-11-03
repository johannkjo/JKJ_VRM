import { notFound } from "next/navigation";
import ContactForm from "@/components/ContactForm";
import { ownerScope, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateContact } from "../../../_actions/contacts";

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireUser();
  const { id } = await params;
  const c = await db.contact.findFirst({ where: { id, ...ownerScope(s, "ownerId") } });
  if (!c) notFound();
  return (
    <div className="space-y-4">
      <h1 className="h1">Breyta: {c.name}</h1>
      <ContactForm action={updateContact.bind(null, id)} c={c} />
    </div>
  );
}
