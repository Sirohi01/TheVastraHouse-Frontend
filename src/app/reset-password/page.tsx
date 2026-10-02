"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";

export default function ResetPasswordPage() {
  const token = useSearchParams().get("token") ?? "";
  const [message, setMessage] = useState(
    token ? "Enter a new password." : "Reset token missing. Request a new reset link.",
  );

  async function submit(formData: FormData) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
    const response = await fetch(`${apiBaseUrl}/auth/reset-password`, {
      body: JSON.stringify({ password: formData.get("password"), token }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setMessage(
      response.ok
        ? "Password reset. Please sign in again."
        : "Password reset failed. Request a new link.",
    );
  }

  return (
    <PublicPageFrame
      eyebrow="Account"
      title="Reset password"
      description="Choose a new password for your account."
    >
      <section className="mx-auto max-w-md">
        <form action={submit} className="rounded-md border border-[#e5dac7] bg-[#fffaf1] p-6">
          <input
            className="h-11 w-full rounded-md border border-border px-3"
            disabled={!token}
            name="password"
            placeholder="New password"
            required
            type="password"
          />
          <button
            className="mt-4 h-11 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60"
            disabled={!token}
            type="submit"
          >
            Reset password
          </button>
          <p className="mt-4 text-sm text-muted-foreground">{message}</p>
        </form>
      </section>
    </PublicPageFrame>
  );
}
