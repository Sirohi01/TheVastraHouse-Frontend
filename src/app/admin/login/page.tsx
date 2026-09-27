"use client";

import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type SubmitEvent, useCallback, useEffect, useRef, useState } from "react";
import { apiBaseUrl } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/stores/authStore";

/**
 * Admin sign-in flow:
 *   credentials ─┬─> totp (authenticator already set up) ───────────────> dashboard
 *                └─> email-code ─> scan QR + confirm code (first-time 2FA) ─> dashboard
 * After the password is verified the API returns a short-lived challenge token; every later step
 * uses it instead of the password. It is kept in sessionStorage so a refresh resumes the step.
 */
type Stage = "credentials" | "email-code" | "scan" | "totp";

type ApiError = { code?: string; message?: string };

type ApiPayload = {
  error?: string | ApiError;
  challengeToken?: string;
  challengeExpiresInSeconds?: number;
  resendAfterSeconds?: number;
  devOnlyEmailCode?: string;
};

type SessionPayload = { accessToken: string; refreshToken: string; user: AuthUser };

type TotpSetup = {
  accountLabel: string;
  issuer: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
  totpSecret: string;
};

type SavedChallenge = {
  challengeToken: string;
  email: string;
  expiresAt: number;
  stage: Exclude<Stage, "credentials">;
};

type Notice = { tone: "error" | "info" | "success"; text: string };

const CHALLENGE_STORAGE_KEY = "vastra-admin-login-challenge";

export default function AdminLoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const signedInUser = useAuthStore((state) => state.user);
  const signedInToken = useAuthStore((state) => state.accessToken);

  const [stage, setStage] = useState<Stage>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [devCode, setDevCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const resendIn = Math.max(0, Math.ceil((resendAt - now) / 1000));

  useEffect(() => {
    if (hasHydrated && signedInUser?.type === "admin" && signedInToken) {
      router.replace("/admin");
    }
  }, [hasHydrated, router, signedInToken, signedInUser]);

  useEffect(() => {
    if (resendAt <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  useEffect(() => {
    if (stage !== "credentials") codeInputRef.current?.focus();
  }, [stage, setup]);

  const goToStage = useCallback((next: SavedChallenge) => {
    writeSavedChallenge(next);
    setChallengeToken(next.challengeToken);
    setEmail(next.email);
    setStage(next.stage);
    setCode("");
  }, []);

  const restartSignIn = useCallback((text?: string) => {
    clearSavedChallenge();
    setStage("credentials");
    setChallengeToken("");
    setSetup(null);
    setCode("");
    setDevCode("");
    setPassword("");
    setNotice(text ? { tone: "error", text } : null);
  }, []);

  const loadSetup = useCallback(
    async (token: string, emailCode?: string) => {
      const response = await postJson("/auth/admin/totp/setup", {
        challengeToken: token,
        emailCode,
      });
      const payload = (await response.json()) as ApiPayload & Partial<TotpSetup>;

      if (!response.ok) {
        if (errorCode(payload) === "ADMIN_CHALLENGE_EXPIRED") {
          restartSignIn(errorMessage(payload, "Please sign in again."));
        } else {
          setNotice({
            tone: "error",
            text: errorMessage(payload, "Could not start authenticator setup."),
          });
          setCode("");
        }
        return false;
      }

      setSetup(payload as TotpSetup);
      return true;
    },
    [restartSignIn],
  );

  // Resume an in-progress sign-in after a refresh instead of asking for the password again.
  useEffect(() => {
    const saved = readSavedChallenge();
    if (!saved) {
      setRestoring(false);
      return;
    }

    goToStage(saved);
    if (saved.stage === "scan") {
      void loadSetup(saved.challengeToken).finally(() => setRestoring(false));
    } else {
      setRestoring(false);
    }
  }, [goToStage, loadSetup]);

  async function run(task: () => Promise<void>) {
    if (submitting) return;
    setSubmitting(true);
    setNotice(null);
    try {
      await task();
    } catch {
      setNotice({
        tone: "error",
        text: "Could not reach the server. Check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function finishSignIn(payload: SessionPayload) {
    if (payload.user.type !== "admin") {
      restartSignIn("This login is only for admin users.");
      return;
    }
    clearSavedChallenge();
    setSession(payload);
    setNotice({ tone: "success", text: "Verified. Opening your dashboard..." });
    router.replace("/admin");
  }

  function handleCodeFailure(payload: ApiPayload, fallback: string) {
    if (errorCode(payload) === "ADMIN_CHALLENGE_EXPIRED") {
      restartSignIn(errorMessage(payload, "Please sign in again."));
      return;
    }
    setNotice({ tone: "error", text: errorMessage(payload, fallback) });
    setCode("");
    codeInputRef.current?.focus();
  }

  function submitCredentials(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      const response = await postJson("/auth/login", { email: email.trim(), password });
      const payload = (await response.json()) as ApiPayload & Partial<SessionPayload>;

      if (response.ok) {
        finishSignIn(payload as SessionPayload);
        return;
      }

      const expiresAt = Date.now() + (payload.challengeExpiresInSeconds ?? 600) * 1000;
      const token = payload.challengeToken;

      if (errorCode(payload) === "ADMIN_2FA_SETUP_REQUIRED" && token) {
        setPassword("");
        setDevCode(payload.devOnlyEmailCode ?? "");
        setResendAt(Date.now() + (payload.resendAfterSeconds ?? 45) * 1000);
        setNow(Date.now());
        goToStage({ challengeToken: token, email: email.trim(), expiresAt, stage: "email-code" });
        setNotice({ tone: "info", text: `We emailed a 6-digit setup code to ${email.trim()}.` });
        return;
      }

      if (errorCode(payload) === "ADMIN_TOTP_REQUIRED" && token) {
        setPassword("");
        goToStage({ challengeToken: token, email: email.trim(), expiresAt, stage: "totp" });
        return;
      }

      setNotice({ tone: "error", text: errorMessage(payload, "Admin login failed.") });
    });
  }

  function submitEmailCode(value = code) {
    if (!/^\d{6}$/.test(value)) {
      setNotice({ tone: "error", text: "Enter the 6-digit code from your email." });
      return;
    }
    void run(async () => {
      if (await loadSetup(challengeToken, value)) {
        const saved = readSavedChallenge();
        goToStage({
          challengeToken,
          email,
          expiresAt: saved?.expiresAt ?? Date.now() + 600_000,
          stage: "scan",
        });
        setDevCode("");
        setNotice({ tone: "success", text: "Email verified. Now link your authenticator app." });
      }
    });
  }

  function submitAuthenticatorCode(value = code) {
    if (!/^\d{6}$/.test(value)) {
      setNotice({ tone: "error", text: "Enter the 6-digit code from your authenticator app." });
      return;
    }
    const path = stage === "scan" ? "/auth/admin/totp/enable" : "/auth/admin/login/verify";
    void run(async () => {
      const response = await postJson(path, { challengeToken, totpToken: value });
      const payload = (await response.json()) as ApiPayload & Partial<SessionPayload>;
      if (!response.ok) {
        handleCodeFailure(payload, "The authenticator code is incorrect.");
        return;
      }
      finishSignIn(payload as SessionPayload);
    });
  }

  function resendEmailCode() {
    void run(async () => {
      const response = await postJson("/auth/admin/totp/resend", { challengeToken });
      const payload = (await response.json()) as ApiPayload;
      if (!response.ok) {
        handleCodeFailure(payload, "Could not resend the code.");
        return;
      }
      setDevCode(payload.devOnlyEmailCode ?? "");
      setResendAt(Date.now() + (payload.resendAfterSeconds ?? 45) * 1000);
      setNow(Date.now());
      setNotice({ tone: "info", text: `A new code was sent to ${email}.` });
    });
  }

  function onCodeChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    // Auto-submit once all 6 digits are in (typed, pasted or autofilled).
    if (digits.length === 6 && !submitting) {
      if (stage === "email-code") submitEmailCode(digits);
      else submitAuthenticatorCode(digits);
    }
  }

  async function copySecret() {
    if (!setup) return;
    try {
      await navigator.clipboard.writeText(setup.totpSecret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setNotice({ tone: "info", text: "Copy failed. Select the key and copy it manually." });
    }
  }

  const header = STAGE_COPY[stage];
  const setupStep = stage === "email-code" ? 1 : stage === "scan" ? 2 : 0;

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
        <section className="grid w-full overflow-hidden rounded-b-md border border-x border-b border-[#e5dac7] bg-[#fffdf8] shadow-[0_30px_80px_-40px_rgba(46,12,18,0.55)] lg:grid-cols-[1.08fr_460px]">
          {/* Brand / maroon panel */}
          <div className="relative flex min-h-[320px] flex-col justify-between overflow-hidden bg-[#842033] p-7 text-white sm:p-10 lg:min-h-[640px]">
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
                Two-factor protected
              </span>
              <span className="inline-flex items-center gap-2">
                <Sparkles aria-hidden="true" className="text-[#d8b66d]" size={16} />
                Premium workspace
              </span>
            </div>
          </div>

          {/* Step panel */}
          <div className="flex flex-col justify-center p-6 sm:p-9">
            {restoring ? (
              <div className="grid place-items-center py-24 text-[#6f6256]">
                <Loader2 aria-hidden="true" className="animate-spin text-[#a2713f]" size={28} />
                <p className="mt-3 text-sm">Resuming secure sign-in...</p>
              </div>
            ) : (
              <div className="vh-field" key={stage}>
                {stage !== "credentials" ? (
                  <button
                    className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#6f6256] transition-colors hover:text-[#842033]"
                    onClick={() => restartSignIn()}
                    type="button"
                  >
                    <ArrowLeft aria-hidden="true" size={16} />
                    Use a different account
                  </button>
                ) : null}

                {setupStep ? <SetupSteps current={setupStep} /> : null}

                <div className="flex items-start gap-3">
                  <span className="mt-1 grid size-10 shrink-0 place-items-center rounded-full border border-[#ecd9b3] bg-[#fdf6e8] text-[#842033]">
                    <header.icon aria-hidden="true" size={19} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a2713f]">
                      {header.eyebrow}
                    </p>
                    <h2 className="mt-1.5 font-serif text-[1.7rem] uppercase leading-tight text-[#2c231d]">
                      {header.title}
                    </h2>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[#caa14e]">
                  <span className="h-px w-8 bg-[#caa14e]" />
                  <span aria-hidden="true" className="text-[10px]">
                    ❖
                  </span>
                  <span className="h-px w-4 bg-[#caa14e]/60" />
                </div>
                <p className="mt-3 text-sm leading-6 text-[#6f6256]">
                  {stage === "credentials" ? (
                    header.body
                  ) : (
                    <>
                      {header.body} <span className="font-medium text-[#2c231d]">{email}</span>
                    </>
                  )}
                </p>

                {stage === "credentials" ? (
                  <form className="mt-7" onSubmit={submitCredentials}>
                    <label
                      className="block text-sm font-medium text-[#2c231d]"
                      htmlFor="admin-login-email"
                    >
                      Email
                    </label>
                    <input
                      autoComplete="username"
                      autoFocus
                      className={inputClass}
                      id="admin-login-email"
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      type="email"
                      value={email}
                    />

                    <label
                      className="mt-4 block text-sm font-medium text-[#2c231d]"
                      htmlFor="admin-login-password"
                    >
                      Password
                    </label>
                    <span className="relative block">
                      <input
                        autoComplete="current-password"
                        className={`${inputClass} pr-12`}
                        id="admin-login-password"
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        type={showPassword ? "text" : "password"}
                        value={password}
                      />
                      <button
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        className="absolute right-2 top-[calc(50%+4px)] z-10 grid size-8 -translate-y-1/2 place-items-center rounded-md text-[#6f6256] transition-colors hover:bg-[#f6eee1] hover:text-[#2c231d]"
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

                    <SubmitButton
                      label="Continue"
                      pending={submitting}
                      pendingLabel="Checking credentials..."
                    />
                  </form>
                ) : (
                  <form
                    className="mt-6"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (stage === "email-code") submitEmailCode();
                      else submitAuthenticatorCode();
                    }}
                  >
                    {stage === "scan" && setup ? (
                      <AuthenticatorSetupCard copied={copied} onCopy={copySecret} setup={setup} />
                    ) : null}

                    <label
                      className="block text-sm font-medium text-[#2c231d]"
                      htmlFor="admin-login-code"
                    >
                      {header.codeLabel}
                    </label>
                    <input
                      autoComplete="one-time-code"
                      className={`${inputClass} text-center font-mono text-xl tracking-[0.5em]`}
                      disabled={submitting}
                      id="admin-login-code"
                      inputMode="numeric"
                      maxLength={6}
                      onChange={(event) => onCodeChange(event.target.value)}
                      pattern="\d{6}"
                      placeholder="••••••"
                      ref={codeInputRef}
                      required
                      value={code}
                    />

                    {stage === "email-code" ? (
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-[#6f6256]">Code valid for 10 minutes</span>
                        <button
                          className="font-semibold text-[#842033] transition-colors hover:text-[#6e1423] disabled:cursor-not-allowed disabled:text-[#b3a597]"
                          disabled={resendIn > 0 || submitting}
                          onClick={resendEmailCode}
                          type="button"
                        >
                          {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                        </button>
                      </div>
                    ) : null}

                    {devCode ? (
                      <p className="mt-3 rounded-md border border-dashed border-[#caa14e] bg-[#fffaf0] px-3 py-2 text-xs text-[#6f6256]">
                        Dev mode code:{" "}
                        <span className="font-mono font-semibold text-[#2c231d]">{devCode}</span>
                      </p>
                    ) : null}

                    <SubmitButton
                      label={header.submitLabel}
                      pending={submitting}
                      pendingLabel={stage === "email-code" ? "Verifying code..." : "Verifying..."}
                    />
                  </form>
                )}
              </div>
            )}

            {notice ? (
              <p
                aria-live="polite"
                className={`mt-4 break-words rounded-md border px-3 py-2 text-sm ${NOTICE_STYLES[notice.tone]}`}
                role={notice.tone === "error" ? "alert" : "status"}
              >
                {notice.text}
              </p>
            ) : null}
          </div>
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
        .vh-field { animation: vhFieldIn 0.5s ease-out both; }
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

const inputClass =
  "mt-2 h-12 w-full rounded-md border border-[#e1d6c4] bg-white px-3 outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#a2713f] focus:shadow-[0_0_0_3px_rgba(202,161,78,0.18)] disabled:opacity-60";

const NOTICE_STYLES: Record<Notice["tone"], string> = {
  error: "border-[#e8b4b4] bg-[#fdf2f2] text-[#8a1f2d]",
  info: "border-[#e1d6c4] bg-[#fffdf8] text-[#5d5044]",
  success: "border-[#b9dcc0] bg-[#f1faf3] text-[#23613a]",
};

const STAGE_COPY: Record<
  Stage,
  {
    eyebrow: string;
    title: string;
    body: string;
    codeLabel: string;
    submitLabel: string;
    icon: typeof Mail;
  }
> = {
  credentials: {
    eyebrow: "Sign in",
    title: "Admin Login",
    body: "Use your admin credentials to open the dashboard.",
    codeLabel: "",
    submitLabel: "Continue",
    icon: KeyRound,
  },
  "email-code": {
    eyebrow: "Step 1 of 2 · Verify email",
    title: "Check your inbox",
    body: "Enter the 6-digit setup code we sent to",
    codeLabel: "Email setup code",
    submitLabel: "Verify email",
    icon: Mail,
  },
  scan: {
    eyebrow: "Step 2 of 2 · Link authenticator",
    title: "Scan the QR code",
    body: "Set up Microsoft Authenticator (or any authenticator app) for",
    codeLabel: "6-digit code from the app",
    submitLabel: "Enable & sign in",
    icon: Smartphone,
  },
  totp: {
    eyebrow: "Two-factor sign in",
    title: "Authenticator code",
    body: "Open your authenticator app and enter the current code for",
    codeLabel: "Authenticator code",
    submitLabel: "Verify & sign in",
    icon: ShieldCheck,
  },
};

function SetupSteps({ current }: Readonly<{ current: number }>) {
  const steps = ["Verify email", "Link authenticator"];
  return (
    <ol className="mb-6 flex items-center gap-2 text-xs font-medium">
      {steps.map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;
        return (
          <li className="flex flex-1 items-center gap-2" key={label}>
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full border text-[11px] ${
                done
                  ? "border-[#842033] bg-[#842033] text-white"
                  : active
                    ? "border-[#842033] text-[#842033]"
                    : "border-[#d9ccb8] text-[#a89a8a]"
              }`}
            >
              {done ? <Check aria-hidden="true" size={13} /> : step}
            </span>
            <span className={active || done ? "text-[#2c231d]" : "text-[#a89a8a]"}>{label}</span>
            {step < steps.length ? <span className="h-px flex-1 bg-[#e1d6c4]" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

function AuthenticatorSetupCard({
  copied,
  onCopy,
  setup,
}: Readonly<{ copied: boolean; onCopy: () => void; setup: TotpSetup }>) {
  return (
    <div className="mb-5 rounded-md border border-[#ecd9b3] bg-[#fdf6e8] p-4">
      <ol className="space-y-1 text-sm leading-6 text-[#5d5044]">
        <li>
          1. Open <span className="font-medium text-[#2c231d]">Microsoft Authenticator</span> → tap{" "}
          <span className="font-medium text-[#2c231d]">+</span> →{" "}
          <span className="font-medium text-[#2c231d]">Other account</span>.
        </li>
        <li>2. Scan this QR code.</li>
        <li>3. Enter the 6-digit code the app shows below.</li>
      </ol>

      <div className="mt-4 flex justify-center">
        {/* The SVG carries its own white quiet zone; keep the frame white so it is not eaten into. */}
        <div className="rounded-md border border-[#e1d6c4] bg-white shadow-sm">
          <Image
            alt={`QR code to add ${setup.accountLabel} to your authenticator app`}
            className="block size-[240px] max-w-full"
            height={240}
            src={setup.qrCodeDataUrl}
            unoptimized
            width={240}
          />
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-[#6f6256]">
        Appears in the app as <span className="font-medium">{setup.issuer}</span> ·{" "}
        {setup.accountLabel}
      </p>
      <p className="mt-1 text-center text-xs text-[#6f6256]">
        On this phone already?{" "}
        <a className="font-semibold text-[#842033] underline" href={setup.otpauthUrl}>
          Open in authenticator app
        </a>
      </p>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-medium text-[#842033]">
          Can&apos;t scan? Enter the key manually
        </summary>
        <div className="mt-2 flex items-center gap-2">
          <code className="min-w-0 flex-1 break-all rounded-md border border-[#e1d6c4] bg-white px-3 py-2 font-mono text-xs tracking-wider">
            {setup.totpSecret.replace(/(.{4})/g, "$1 ").trim()}
          </code>
          <button
            aria-label="Copy setup key"
            className="grid size-9 shrink-0 place-items-center rounded-md border border-[#caa14e] text-[#842033] transition-colors hover:bg-[#fff8e8]"
            onClick={onCopy}
            type="button"
          >
            {copied ? (
              <Check aria-hidden="true" size={16} />
            ) : (
              <Copy aria-hidden="true" size={16} />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-[#6f6256]">
          Choose &quot;Time based&quot; if the app asks.
        </p>
      </details>
    </div>
  );
}

function SubmitButton({
  label,
  pending,
  pendingLabel,
}: Readonly<{ label: string; pending: boolean; pendingLabel: string }>) {
  return (
    <button
      className="group relative mt-6 inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-md bg-[#842033] px-4 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors duration-200 hover:bg-[#6e1423] disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      <span className="pointer-events-none absolute left-1.5 top-1.5 size-1.5 border-l border-t border-[#e4c17b]/70" />
      <span className="pointer-events-none absolute bottom-1.5 right-1.5 size-1.5 border-b border-r border-[#e4c17b]/70" />
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 aria-hidden="true" className="animate-spin text-[#e4c17b]" size={17} />
          {pendingLabel}
        </span>
      ) : (
        label
      )}
    </button>
  );
}

function postJson(path: string, body: Record<string, unknown>) {
  return fetch(`${apiBaseUrl}${path}`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

function errorMessage(payload: ApiPayload, fallback: string) {
  if (typeof payload.error === "string" && payload.error.trim()) return payload.error;
  if (payload.error && typeof payload.error === "object" && payload.error.message?.trim()) {
    return payload.error.message;
  }
  return fallback;
}

function errorCode(payload: ApiPayload) {
  return payload.error && typeof payload.error === "object" ? payload.error.code : undefined;
}

function readSavedChallenge(): SavedChallenge | null {
  try {
    const raw = window.sessionStorage.getItem(CHALLENGE_STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedChallenge;
    if (!saved.challengeToken || !saved.stage || saved.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(CHALLENGE_STORAGE_KEY);
      return null;
    }
    return saved;
  } catch {
    return null;
  }
}

function writeSavedChallenge(challenge: SavedChallenge) {
  try {
    window.sessionStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(challenge));
  } catch {
    // Storage unavailable (private mode): the flow still works, it just won't survive a refresh.
  }
}

function clearSavedChallenge() {
  try {
    window.sessionStorage.removeItem(CHALLENGE_STORAGE_KEY);
  } catch {
    // Ignore storage access errors.
  }
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
