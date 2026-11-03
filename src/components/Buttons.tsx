"use client";

import { useFormStatus } from "react-dom";

export function Submit({ children, className = "btn", pendingText = "Vista…" }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

/** Hnappur sem biður um staðfestingu áður en formi er skilað. */
export function ConfirmSubmit({ children, message, className = "btn-danger" }: { children: React.ReactNode; message: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
