import PropertyForm from "@/components/PropertyForm";
import { ownerScope, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createProperty } from "../../_actions/properties";

export default async function NewPropertyPage() {
  const s = await requireUser();
  const sellers = await db.contact.findMany({ where: ownerScope(s, "ownerId"), select: { id: true, name: true }, orderBy: { name: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className="h1">Ný eign</h1>
      <PropertyForm action={createProperty} sellers={sellers} />
    </div>
  );
}
