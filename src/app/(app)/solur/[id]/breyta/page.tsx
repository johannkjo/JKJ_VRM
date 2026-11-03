import { notFound } from "next/navigation";
import DealForm from "@/components/DealForm";
import { ownerScope, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateDeal } from "../../../_actions/deals";

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireUser();
  const { id } = await params;
  const d = await db.deal.findFirst({ where: { id, ...ownerScope(s, "agentId") } });
  if (!d) notFound();
  const [contacts, properties] = await Promise.all([
    db.contact.findMany({ where: ownerScope(s, "ownerId"), select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.property.findMany({ where: ownerScope(s, "agentId"), select: { id: true, address: true, listing: true, price: true, sellerId: true }, orderBy: { address: "asc" } }),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="h1">Breyta: {d.title}</h1>
      <DealForm action={updateDeal.bind(null, id)} d={d} contacts={contacts} properties={properties} />
    </div>
  );
}
