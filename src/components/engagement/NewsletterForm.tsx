"use client";

import { useState } from "react";
import { apiFetch, errorMessage } from "@/lib/api";

/** Newsletter signup with explicit consent (FR-MKT-01, DPDP-style consent capture). */
export function NewsletterForm({
  source,
  tone = "light",
}: Readonly<{ source: string; tone?: "light" | "dark" }>) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<{
    kind: "idle" | "saving" | "done" | "error";
    message?: string;
  }>({ kind: "idle" });
  const id = `newsletter-${source}`;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!consent) {
      setState({ kind: "error", message: "Please tick the box to confirm you want our emails." });
      return;
    }
    setState({ kind: "saving" });
    try {
      const result = await apiFetch<{ alreadySubscribed: boolean }>("/engagement/newsletter", {
        body: JSON.stringify({ consent: true, email, source }),
        method: "POST",
      });
      setState({
        kind: "done",
        message: result.alreadySubscribed
          ? "You are already subscribed — thank you!"
          : "Thanks for subscribing! Check your inbox.",
      });
      setEmail("");
    } catch (error) {
      setState({ kind: "error", message: errorMessage(error) });
    }
  }

  if (state.kind === "done") {
    return (
      <p
        className={`mt-3 text-sm font-semibold ${tone === "dark" ? "text-[#f0d9a4]" : "text-emerald-700"}`}
        role="status"
      >
        {state.message}
      </p>
    );
  }

  return (
    <form className="mt-3 grid gap-2" onSubmit={submit}>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor={id}>
          Email address
        </label>
        <input
          autoComplete="email"
          className={`h-11 min-w-0 flex-1 px-3 text-sm ${
            tone === "dark"
              ? "rounded-none border border-[#caa14e]/60 bg-[#fffaf1]/5 tracking-wide text-[#f6ecda] outline-none transition placeholder:text-[#f6ecda]/50 focus:border-[#e6c67a]"
              : "rounded-md border border-border bg-white text-foreground"
          }`}
          id={id}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Your email"
          required
          type="email"
          value={email}
        />
        <button
          className={`h-11 shrink-0 px-5 text-sm disabled:opacity-60 ${
            tone === "dark"
              ? "bg-gradient-to-b from-[#e6c67a] to-[#c39a45] text-xs font-medium uppercase tracking-[0.18em] text-[#2e0c12] transition hover:brightness-110"
              : "rounded-md bg-primary font-semibold text-primary-foreground"
          }`}
          disabled={state.kind === "saving"}
          type="submit"
        >
          {state.kind === "saving" ? "…" : "Subscribe"}
        </button>
      </div>
      <label
        className={`flex items-start gap-2 text-xs ${tone === "dark" ? "text-white/80" : "text-[#6f6256]"}`}
      >
        <input
          checked={consent}
          className="mt-0.5"
          onChange={(event) => setConsent(event.target.checked)}
          type="checkbox"
        />
        <span>I agree to receive marketing emails. I can unsubscribe any time.</span>
      </label>
      {state.kind === "error" ? (
        <p
          className={`text-xs ${tone === "dark" ? "text-[#ffb4a8]" : "text-destructive"}`}
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
