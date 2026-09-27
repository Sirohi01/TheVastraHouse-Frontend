"use client";

import { Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiBaseUrl } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/stores/authStore";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type TotpSetupResponse = {
  error?: string | { code?: string; message?: string };
  otpauthUrl?: string;
  totpSecret?: string;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [message, setMessage] = useState("");
  const [needsSetupCode, setNeedsSetupCode] = useState(false);
  const [needsTotpCode, setNeedsTotpCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [totpSetupKey, setTotpSetupKey] = useState("");
  const [totpSetupUrl, setTotpSetupUrl] = useState("");

  async function submit(formData: FormData) {
    setSubmitting(true);
    setMessage("Checking secure admin login...");

    try {
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");
      const emailCode = String(formData.get("emailCode") ?? "");
      const totpToken = String(formData.get("totpToken") ?? "");

      if (needsSetupCode && !totpSetupUrl) {
        if (!/^\d{6}$/.test(emailCode)) {
          setMessage("Enter the 6-digit setup code sent to your email.");
          return;
        }

        const setupResponse = await fetch(`${apiBaseUrl}/auth/admin/totp/setup`, {
          body: JSON.stringify({ email, password, emailCode }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const setupPayload = (await setupResponse.json()) as TotpSetupResponse;

        if (!setupResponse.ok) {
          setMessage(getAuthErrorMessage(setupPayload, "TOTP setup failed"));
          return;
        }

        if (setupPayload.otpauthUrl) {
          setTotpSetupUrl(setupPayload.otpauthUrl);
        }
        if (setupPayload.totpSecret) {
          setTotpSetupKey(setupPayload.totpSecret);
        }
        setNeedsSetupCode(false);
        setNeedsTotpCode(true);
        setMessage("Add this key to your authenticator app, then enter the 6-digit code.");
        return;
      }

      if (totpSetupUrl && !/^\d{6}$/.test(totpToken)) {
        setMessage("Enter the 6-digit code from your authenticator app.");
        return;
      }

      if (totpSetupUrl) {
        const setupResponse = await fetch(`${apiBaseUrl}/auth/admin/totp/enable`, {
          body: JSON.stringify({ email, password, totpToken }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        if (!setupResponse.ok) {
          const payload = (await setupResponse.json()) as TotpSetupResponse;
          if (payload.otpauthUrl) {
            setTotpSetupUrl(payload.otpauthUrl);
            setNeedsTotpCode(true);
          }
          if (payload.totpSecret) {
            setTotpSetupKey(payload.totpSecret);
          }
          setMessage(getAuthErrorMessage(payload, "TOTP setup failed"));
          return;
        }

        setNeedsSetupCode(false);
        setNeedsTotpCode(true);
        setTotpSetupKey("");
        setTotpSetupUrl("");
        setMessage("TOTP enabled. Signing you in...");
      }

      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        body: JSON.stringify({
          email,
          password,
          totpToken: totpToken || undefined,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json()) as TotpSetupResponse;
        const errorMessage = getAuthErrorMessage(payload, "Admin login failed");
        const errorCode = getAuthErrorCode(payload);
        if (errorCode === "ADMIN_2FA_SETUP_REQUIRED") {
          setNeedsSetupCode(true);
          setNeedsTotpCode(false);
          setTotpSetupKey("");
          setTotpSetupUrl("");
          setMessage("Two-factor setup required. Enter the 6-digit setup code sent to your email.");
          return;
        }
        if (errorCode === "ADMIN_TOTP_REQUIRED" || errorMessage.toLowerCase().includes("authenticator")) {
          setNeedsSetupCode(false);
          setNeedsTotpCode(true);
          setTotpSetupKey("");
          setTotpSetupUrl("");
        }
        setMessage(
          payload.otpauthUrl
            ? "TOTP setup required. Add the setup key below to your authenticator app, then submit the 6-digit code."
            : errorMessage,
        );
        if (errorMessage.toLowerCase().includes("totp")) {
          setNeedsTotpCode(true);
        }
        return;
      }

      const payload = (await response.json()) as LoginResponse;
      if (payload.user.type !== "admin") {
        setMessage("This login is only for admin users.");
        return;
      }

      setSession(payload);
      setNeedsSetupCode(false);
      setNeedsTotpCode(false);
      setTotpSetupKey("");
      setTotpSetupUrl("");
      router.push("/admin");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Admin login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#fbf7ef] px-4 py-8 text-[#211f1c] sm:px-5">
      {/* Ambient royal glows + faint damask lattice */}
      <div
        aria-hidden="true"
        className="vh-drift pointer-events-none absolute -left-24 -top-24 size-[420px] rounded-full bg-[#6e1423]/15 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="vh-drift-slow pointer-events-none absolute -bottom-24 -right-16 size-[420px] rounded-full bg-[#caa14e]/20 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #6e1423 1px, transparent 0), radial-gradient(circle at 21px 21px, #caa14e 1.4px, transparent 0)",
          backgroundSize: "42px 42px",
        }}
      />

      <div className="vh-rise relative w-full max-w-6xl">
        <div className="h-[3px] rounded-t bg-[linear-gradient(90deg,#6e1423,#caa14e,#6e1423)]" />
        <section className="grid w-full overflow-hidden rounded-b-md border border-x border-b border-[#e5dac7] bg-[#fffdf8] shadow-[0_30px_80px_-40px_rgba(46,12,18,0.55)] lg:grid-cols-[1.08fr_440px]">
          {/* Brand / maroon panel */}
          <div className="relative flex min-h-[420px] flex-col justify-between overflow-hidden bg-[#842033] p-7 text-white sm:p-10 lg:min-h-[620px]">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgb(255_255_255/0.12),transparent_42%),linear-gradient(0deg,rgb(42_24_12/0.24),transparent)]" />

            {/* Gold inset frame + corner filigree */}
            <div className="pointer-events-none absolute inset-4 border border-[#d8b66d]/35 sm:inset-6">
              <CornerFiligree className="absolute -left-px -top-px text-[#e4c17b]/85" />
              <CornerFiligree className="absolute -right-px -top-px rotate-90 text-[#e4c17b]/85" />
              <CornerFiligree className="absolute -bottom-px -right-px rotate-180 text-[#e4c17b]/85" />
              <CornerFiligree className="absolute -bottom-px -left-px -rotate-90 text-[#e4c17b]/85" />
            </div>

            <div className="relative">
              <div className="vh-glow relative inline-flex size-12 items-center justify-center rounded-full border border-white/30 bg-white/10">
                <ShieldCheck aria-hidden="true" className="text-[#d8b66d]" size={28} />
              </div>
              <p className="relative mt-8 text-xs font-semibold uppercase tracking-[0.28em] text-[#e4c17b]">
                Vastra House Admin
              </p>
              <h1 className="relative mt-4 max-w-xl font-serif text-4xl uppercase leading-tight sm:text-5xl">
                Secure Operations Console
              </h1>
              <div className="relative mt-5 flex items-center gap-2">
                <span
                  className="vh-sweep h-px w-24 rounded-full"
                  style={{
                    backgroundImage: "linear-gradient(90deg,transparent,#e4c17b,transparent)",
                    backgroundSize: "200% 100%",
                  }}
                />
                <span aria-hidden="true" className="text-xs text-[#e4c17b]">
                  ✦
                </span>
              </div>
              <p className="relative mt-5 max-w-lg text-sm leading-7 text-white/80 sm:text-base sm:leading-8">
                Manage products, orders, inventory, payments, returns, pre-orders, and CMS content
                from one role-protected workspace.
              </p>
            </div>

            <div className="relative mt-8 grid gap-3 text-sm text-white/78 sm:grid-cols-2">
              <span className="inline-flex items-center gap-2">
                <LockKeyhole aria-hidden="true" className="text-[#d8b66d]" size={16} />
                Protected access
              </span>
              <span className="inline-flex items-center gap-2">
                <Sparkles aria-hidden="true" className="text-[#d8b66d]" size={16} />
                Premium workspace
              </span>
            </div>
          </div>

          {/* Form panel */}
          <form action={submit} className="flex flex-col justify-center p-6 sm:p-9">
            <div className="vh-field" style={{ animationDelay: "0.05s" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a2713f]">
                Sign in
              </p>
              <h2 className="mt-3 font-serif text-3xl uppercase text-[#2c231d]">Admin Login</h2>
              <div className="mt-3 flex items-center gap-2 text-[#caa14e]">
                <span className="h-px w-8 bg-[#caa14e]" />
                <span aria-hidden="true" className="text-[10px]">
                  ❖
                </span>
                <span className="h-px w-4 bg-[#caa14e]/60" />
              </div>
              <p className="mt-3 text-sm leading-6 text-[#6f6256]">
                Use your admin credentials to open the dashboard.
              </p>
            </div>

            <label
              className="vh-field mt-7 text-sm font-medium text-[#2c231d]"
              style={{ animationDelay: "0.12s" }}
            >
              Email
              <input
                className="mt-2 h-12 w-full rounded-md border border-[#e1d6c4] bg-white px-3 outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#a2713f] focus:shadow-[0_0_0_3px_rgba(202,161,78,0.18)]"
                name="email"
                required
                type="email"
              />
            </label>

            <div
              className="vh-field mt-4 text-sm font-medium text-[#2c231d]"
              style={{ animationDelay: "0.18s" }}
            >
              <label htmlFor="admin-login-password">Password</label>
              <span className="relative mt-2 block">
                <input
                  autoComplete="current-password"
                  className="h-12 w-full rounded-md border border-[#e1d6c4] bg-white px-3 pr-12 outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#a2713f] focus:shadow-[0_0_0_3px_rgba(202,161,78,0.18)]"
                  id="admin-login-password"
                  name="password"
                  required
                  type={showPassword ? "text" : "password"}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-md text-[#6f6256] transition-colors hover:bg-[#f6eee1] hover:text-[#2c231d]"
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" size={17} />
                  ) : (
                    <Eye aria-hidden="true" size={17} />
                  )}
                </button>
              </span>
            </div>

            {needsSetupCode ? (
              <label className="vh-field mt-4 text-sm font-medium text-[#2c231d]">
                Email setup code
                <input
                  autoComplete="one-time-code"
                  className="mt-2 h-12 w-full rounded-md border border-[#e1d6c4] bg-white px-3 tracking-[0.4em] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#a2713f] focus:shadow-[0_0_0_3px_rgba(202,161,78,0.18)]"
                  inputMode="numeric"
                  maxLength={6}
                  name="emailCode"
                  placeholder="6 digits"
                  required
                />
              </label>
            ) : null}

            {needsTotpCode ? (
              <label className="vh-field mt-4 text-sm font-medium text-[#2c231d]">
                TOTP Code
                <input
                  autoComplete="one-time-code"
                  className="mt-2 h-12 w-full rounded-md border border-[#e1d6c4] bg-white px-3 tracking-[0.4em] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#a2713f] focus:shadow-[0_0_0_3px_rgba(202,161,78,0.18)]"
                  inputMode="numeric"
                  maxLength={6}
                  name="totpToken"
                  placeholder="6 digits"
                  required
                />
              </label>
            ) : null}

            {totpSetupUrl ? (
              <div className="vh-field mt-4 space-y-3 rounded-md border border-[#ecd9b3] bg-[#fdf6e8] p-3">
                <p className="text-sm leading-6 text-[#5d5044]">
                  Add this account in your authenticator app once. After it is enabled, this setup
                  panel will disappear and future logins will only ask for the current 6-digit code.
                </p>
                {totpSetupKey ? (
                  <label className="block text-sm font-medium text-[#2c231d]">
                    Manual setup key
                    <input
                      className="mt-2 h-11 w-full rounded-md border border-[#e1d6c4] bg-white px-3 font-mono text-xs"
                      readOnly
                      value={totpSetupKey}
                    />
                  </label>
                ) : null}
                <a
                  className="inline-flex h-10 items-center justify-center rounded-md border border-[#caa14e] px-3 text-sm font-semibold text-[#842033] transition-colors hover:bg-[#fff8e8]"
                  href={totpSetupUrl}
                >
                  Open authenticator app
                </a>
              </div>
            ) : null}

            <button
              className="group vh-field relative mt-6 inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-md bg-[#842033] px-4 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors duration-200 hover:bg-[#6e1423] disabled:opacity-70"
              disabled={submitting}
              style={{ animationDelay: "0.24s" }}
            >
              <span className="pointer-events-none absolute left-1.5 top-1.5 size-1.5 border-l border-t border-[#e4c17b]/70" />
              <span className="pointer-events-none absolute bottom-1.5 right-1.5 size-1.5 border-b border-r border-[#e4c17b]/70" />
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 aria-hidden="true" className="animate-spin text-[#e4c17b]" size={17} />
                  {getSubmittingLabel(needsSetupCode, Boolean(totpSetupUrl))}
                </span>
              ) : (
                "Continue"
              )}
            </button>

            {message ? (
              <p
                aria-live="polite"
                className="vh-field mt-4 break-words rounded-md border border-[#e1d6c4] bg-[#fffdf8] px-3 py-2 text-sm text-muted-foreground"
                role="status"
              >
                {message}
              </p>
            ) : null}
          </form>
        </section>
      </div>

      <style>{`
        @keyframes vhRise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes vhFieldIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes vhSweep { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes vhGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(216,182,109,0); } 50% { box-shadow: 0 0 0 6px rgba(216,182,109,0.16); } }
        @keyframes vhDrift { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(16px,-12px); } }
        @keyframes vhDriftSlow { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-18px,14px); } }

        .vh-rise { animation: vhRise 0.7s ease-out both; }
        .vh-field { animation: vhFieldIn 0.6s ease-out both; }
        .vh-sweep { animation: vhSweep 3.2s linear infinite; }
        .vh-glow { animation: vhGlow 2.6s ease-in-out infinite; }
        .vh-drift { animation: vhDrift 11s ease-in-out infinite; }
        .vh-drift-slow { animation: vhDriftSlow 13s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .vh-rise, .vh-field, .vh-sweep, .vh-glow, .vh-drift, .vh-drift-slow {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </main>
  );
}

function getAuthErrorMessage(payload: TotpSetupResponse, fallback: string) {
  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }

  if (
    payload.error &&
    typeof payload.error === "object" &&
    typeof payload.error.message === "string" &&
    payload.error.message.trim()
  ) {
    return payload.error.message;
  }

  return fallback;
}

function getAuthErrorCode(payload: TotpSetupResponse) {
  return payload.error && typeof payload.error === "object" ? payload.error.code : undefined;
}

function getSubmittingLabel(needsSetupCode: boolean, hasTotpSetupUrl: boolean) {
  if (needsSetupCode) {
    return "Checking setup code...";
  }

  if (hasTotpSetupUrl) {
    return "Enabling TOTP...";
  }

  return "Signing in...";
}

function CornerFiligree({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="34"
      stroke="currentColor"
      strokeWidth="1"
      viewBox="0 0 34 34"
      width="34"
    >
      <path d="M1 12C1 6 6 1 12 1" />
      <path d="M1 20c6 0 11-5 11-11" />
      <circle cx="12" cy="12" fill="currentColor" r="1.6" stroke="none" />
    </svg>
  );
}
