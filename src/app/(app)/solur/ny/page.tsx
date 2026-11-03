import DealForm from "@/components/DealForm";
import { ownerScope, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createDeal } from "../../_actions/deals";

export default async function NewDealPage({ searchParams }: { searchParams: Promise<{ propertyId?: string }> }) {
  const s = await requireUser();
  const { propertyId } = await searchParams;
  const [contacts, properties] = await Promise.all([
    db.contact.findMany({ where: ownerScope(s, "ownerId"), select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.property.findMany({ where: ownerScope(s, "agentId"), select: { id: true, address: true, listing: true, price: true, sellerId: true }, orderBy: { address: "asc" } }),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="h1">Ný sala / leiga</h1>
      <p className="muted">Gátlisti er búinn til sjálfkrafa (söluumboð, veðbókarvottorð, kaupsamningur o.s.frv.).</p>
      <DealForm action={createDeal} contacts={contacts} properties={properties} defaults={{ propertyId }} />
    </div>
  );
}
