import ContactForm from "@/components/ContactForm";
import { createContact } from "../../_actions/contacts";

export default function NewContactPage() {
  return (
    <div className="space-y-4">
      <h1 className="h1">Nýr tengiliður</h1>
      <ContactForm action={createContact} />
    </div>
  );
}
