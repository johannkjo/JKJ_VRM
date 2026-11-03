import { messagesWith } from "@/lib/integrations/microsoft";
import { dateTime } from "@/lib/format";

/** Nýlegir tölvupóstar úr Outlook til/frá tengilið (birtist bara ef M365 er tengt). */
export default async function OutlookMails({ userId, email }: { userId: string; email: string }) {
  let mails;
  try {
    mails = await messagesWith(userId, email);
  } catch (e) {
    return <section className="card"><h2 className="h2">Tölvupóstar (Outlook)</h2><p className="text-sm text-red-600">{(e as Error).message}</p></section>;
  }
  if (mails === null) return null;
  return (
    <section className="card">
      <h2 className="h2">Tölvupóstar (Outlook)</h2>
      {mails.length === 0 && <p className="muted">Engir póstar fundust til eða frá {email}.</p>}
      <ul className="divide-y divide-slate-100 text-sm">
        {mails.map((m) => (
          <li key={m.id} className="py-2">
            <a href={m.webLink} target="_blank" rel="noreferrer" className="block hover:bg-slate-50">
              <p className="font-medium">{m.outgoing ? "↗ " : "↙ "}{m.subject}</p>
              <p className="line-clamp-2 text-xs text-slate-500">{dateTime(m.received)} · {m.from} – {m.preview}</p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
