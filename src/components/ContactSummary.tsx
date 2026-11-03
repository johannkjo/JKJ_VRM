"use client";

import { useState, useTransition } from "react";
import { aiSummarizeContact } from "@/app/(app)/_actions/ai";

export default function ContactSummary({ contactId }: { contactId: string }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="h2 mb-0">Samantekt</h2>
        <button
          className="btn-secondary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              const r = await aiSummarizeContact(contactId);
              if (r.error) setError(r.error);
              else setText(r.text ?? "");
            })
          }
        >
          {pending ? "Claude les söguna…" : text ? "↻ Uppfæra" : "✨ Samantekt með Claude"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {text && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{text}</p>}
    </section>
  );
}
