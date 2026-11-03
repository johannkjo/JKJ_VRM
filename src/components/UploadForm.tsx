"use client";

import { useActionState, useRef } from "react";
import { uploadDocuments } from "@/app/(app)/_actions/documents";

export default function UploadForm({ links, back }: { links: Record<string, string | undefined>; back: string }) {
  const form = useRef<HTMLFormElement>(null);
  const [error, action, pending] = useActionState(async (prev: string | null, fd: FormData) => {
    const r = await uploadDocuments(prev, fd);
    if (!r) form.current?.reset();
    return r;
  }, null);
  return (
    <form ref={form} action={action} className="flex flex-wrap items-center gap-2">
      {Object.entries(links).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
      <input type="hidden" name="back" value={back} />
      <input
        type="file"
        name="files"
        multiple
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
        className="min-w-0 flex-1 text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm"
        onChange={() => form.current?.requestSubmit()}
      />
      {pending && <span className="text-sm text-slate-500">Hleð upp…</span>}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  );
}
