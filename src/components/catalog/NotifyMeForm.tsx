"use client";

import { BellRing } from "lucide-react";
import { useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

/** "Notify me when available" for an out-of-stock variant (FR-CAT-10). */
export function NotifyMeForm({
  productId,
  variantId,
}: Readonly<{ productId: string; variantId: string }>) {
  const user = useAuthStore((state) => state.user);
  const [email, setEmail] = useState(user?.email ?? "");
  const [status, setStatus] = useState<{
    kind: "idle" | "saving" | "done" | "error";
    message?: string;
  }>({ kind: "idle" });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus({ kind: "saving" });

    try {
      const result = await apiFetch<{ alreadySubscribed: boolean }>("/engagement/back-in-stock", {
        body: JSON.stringify({ email, productId, variantId }),
        method: "POST",
      });
      setStatus({
        kind: "done",
        message: result.alreadySubscribed
          ? "You are already on the list for this item."
          : "Done! We will email you as soon as it is back.",
      });
    } catch (error) {
      setStatus({ kind: "error", message: errorMessage(error) });
    }
  }

  if (status.kind === "done") {
    return (
      <p className="mt-3 text-sm font-semibold text-emerald-700" role="status">
        {status.message}
      </p>
    );
  }

  return (
    <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={submit}>
      <label className="sr-only" htmlFor={`notify-${variantId}`}>
        Email address
      </label>
      <input
        autoComplete="email"
        className="h-11 flex-1 rounded-md border border-border px-3 text-sm"
        id={`notify-${variantId}`}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        required
        type="email"
        value={email}
      />
      <button
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        disabled={status.kind === "saving"}
        type="submit"
      >
        <BellRing aria-hidden="true" size={16} />
        {status.kind === "saving" ? "Saving…" : "Notify me"}
      </button>
      {status.kind === "error" ? (
        <p className="text-sm text-destructive sm:basis-full" role="alert">
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
