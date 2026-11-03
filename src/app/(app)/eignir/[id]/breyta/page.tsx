import { notFound } from "next/navigation";
import PropertyForm from "@/components/PropertyForm";
import { ownerScope, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProperty } from "../../../_actions/properties";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireUser();
  const { id } = await params;
  const p = await db.property.findFirst({ where: { id, ...ownerScope(s, "agentId") } });
  if (!p) notFound();
  const sellers = await db.contact.findMany({ where: ownerScope(s, "ownerId"), select: { id: true, name: true }, orderBy: { name: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className="h1">Breyta: {p.address}</h1>
      <PropertyForm action={updateProperty.bind(null, id)} p={p} sellers={sellers} />
    </div>
  );
}
