"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";

export default function OtpPage() {
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const searchParams = useSearchParams();
  const purpose = useMemo(() => {
    const flow = searchParams.get("flow");
    if (flow === "login" || flow === "password-reset" || flow === "sensitive-action") return flow;
    return "registration";
  }, [searchParams]);

  useEffect(() => {
    if (!cooldown) return;
    const id = window.setInterval(() => setCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  async function requestOtp(formData: FormData) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
    const response = await fetch(`${apiBaseUrl}/auth/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: formData.get("target"), purpose }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      resendAfterSeconds?: number;
      message?: string;
    };
    if (response.ok) {
      setTarget(String(formData.get("target") ?? ""));
      setCooldown(payload.resendAfterSeconds ?? 45);
      setAttemptsLeft(5);
      setMessage("Code sent. It expires in 10 minutes.");
      return;
    }
    setMessage(payload.message ?? "OTP request failed");
  }

  async function verifyOtp(formData: FormData) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
    const response = await fetch(`${apiBaseUrl}/auth/otp/verify`, {
      body: JSON.stringify({ code: formData.get("code"), purpose, target }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      resetToken?: string;
    };
    if (response.ok) {
      setMessage(
        payload.resetToken
          ? "Code verified. Continue to reset password from your secure link."
          : "Code verified.",
      );
      return;
    }
    setAttemptsLeft((current) => Math.max(0, current - 1));
    setMessage(payload.message ?? "OTP verification failed");
  }

  return (
    <PublicPageFrame
      eyebrow="Verification"
      title="OTP Verification"
      description="Request a one-time password for account and sensitive customer actions."
    >
      <section className="mx-auto max-w-md">
        <form
          action={requestOtp}
          className="w-full rounded-md border border-[#e5dac7] bg-[#fffaf1] p-6"
        >
          <h2 className="font-serif text-2xl uppercase text-[#3d1620]">OTP Verification</h2>
          <input
            className="mt-6 h-11 w-full rounded-md border border-border px-3"
            name="target"
            onChange={(event) => setTarget(event.target.value)}
            placeholder="Email or phone"
            required
            value={target}
          />
          <button
            className="mt-6 h-11 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            disabled={cooldown > 0}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Request OTP"}
          </button>
          <p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">
            Flow: {purpose.replace("-", " ")}
          </p>
        </form>
        <form
          action={verifyOtp}
          className="mt-4 w-full rounded-md border border-[#e5dac7] bg-[#fffaf1] p-6"
        >
          <input
            className="h-11 w-full rounded-md border border-border px-3"
            inputMode="numeric"
            maxLength={6}
            name="code"
            onChange={(event) => setCode(event.target.value)}
            placeholder="6-digit code"
            required
            value={code}
          />
          <button
            className="mt-4 h-11 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            type="submit"
          >
            Verify code
          </button>
          <p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">
            {attemptsLeft} attempts left
          </p>
          {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
        </form>
      </section>
    </PublicPageFrame>
  );
}
