"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { aiDraftEmail } from "@/app/(app)/_actions/ai";
import { sendEmailToContact } from "@/app/(app)/_actions/email";

export default function EmailComposer({ contactId, email, msConnected }: { contactId: string; email: string; msConnected: boolean }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [purpose, setPurpose] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [drafting, startDraft] = useTransition();
  const [result, send, sending] = useActionState(sendEmailToContact.bind(null, contactId), null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (result === "sent") {
      setSubject("");
      setBody("");
      setPurpose("");
    }
  }, [result]);

  const draft = () =>
    startDraft(async () => {
      setAiError(null);
      const r = await aiDraftEmail(contactId, purpose);
      if (r.error) setAiError(r.error);
      else {
        setSubject(r.subject ?? "");
        setBody(r.body ?? "");
      }
    });

  return (
    <section className="card">
      <h2 className="h2">Senda tölvupóst <span className="text-sm font-normal text-slate-500">til {email}</span></h2>
      <div className="mb-3 flex flex-wrap gap-2">
        <input value={purpose} onChange={(e) => setPurpose(e.target.value)} className="input min-w-48 flex-1" placeholder="Tilgangur, t.d. „bjóða á opið hús á Laugavegi“" />
        <button type="button" onClick={draft} disabled={drafting} className="btn-secondary">{drafting ? "Claude skrifar…" : "✨ Drög með Claude"}</button>
      </div>
      {aiError && <p className="mb-2 text-sm text-red-600">{aiError}</p>}
      <form ref={form} action={send} className="space-y-2">
        <input name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="input" placeholder="Efni" required />
        <textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} className="input" rows={8} placeholder="Texti" required />
        <div className="flex flex-wrap items-center gap-2">
          {msConnected ? (
            <button className="btn" disabled={sending}>{sending ? "Sendi…" : "Senda með Outlook"}</button>
          ) : (
            <a className="btn" href={`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>Opna í pósthólfi</a>
          )}
          {!msConnected && <span className="text-xs text-slate-500">Tengdu Microsoft 365 undir ⚙︎ til að senda beint og skrá sjálfkrafa.</span>}
          {result === "sent" && <span className="text-sm text-brand-700">✓ Sent og skráð í samskiptasögu</span>}
          {result && result !== "sent" && <span className="text-sm text-red-600">{result}</span>}
        </div>
      </form>
    </section>
  );
}
