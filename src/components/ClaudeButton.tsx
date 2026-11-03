"use client";

import { useState, useTransition } from "react";

export default function ClaudeButton({ action, hasText }: { action: () => Promise<string | null>; hasText: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        className="btn-secondary"
        disabled={pending}
        onClick={() => {
          if (hasText && !confirm("Skipta núverandi lýsingu út fyrir nýja frá Claude? (Núverandi texti er notaður sem grunnur.)")) return;
          setError(null);
          start(async () => setError(await action()));
        }}
      >
        {pending ? "Claude skrifar…" : "✨ Skrifa lýsingu með Claude"}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
