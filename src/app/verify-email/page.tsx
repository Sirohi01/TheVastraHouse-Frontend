"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";

export default function VerifyEmailPage() {
  const token = useSearchParams().get("token") ?? "";
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    token ? "Ready to verify your email." : "Enter your email to resend verification.",
  );

  async function verify() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
    const response = await fetch(`${apiBaseUrl}/auth/verify-email`, {
      body: JSON.stringify({ token }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setMessage(
      response.ok
        ? "Email verified. You can sign in now."
        : "This verification link is invalid or expired.",
    );
  }

  async function resend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
    await fetch(`${apiBaseUrl}/auth/resend-verification`, {
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setMessage("If your account needs verification, a new link has been sent.");
  }

  return (
    <PublicPageFrame
      eyebrow="Account"
      title="Verify email"
      description="Confirm your customer account email address."
    >
      <section className="mx-auto max-w-md rounded-md border border-[#e5dac7] bg-[#fffaf1] p-6">
        {token ? (
          <button
            className="h-11 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground"
            onClick={() => void verify()}
            type="button"
          >
            Verify email
          </button>
        ) : (
          <form onSubmit={resend}>
            <input
              className="h-11 w-full rounded-md border border-border px-3"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              required
              type="email"
              value={email}
            />
            <button
              className="mt-4 h-11 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground"
              type="submit"
            >
              Resend verification
            </button>
          </form>
        )}
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      </section>
    </PublicPageFrame>
  );
}
