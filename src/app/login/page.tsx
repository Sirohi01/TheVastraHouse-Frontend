"use client";

import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { TrustLottieIcon } from "@/components/home/TrustLottieIcon";
import { errorMessage, publicFetch } from "@/lib/api";
import { getGuestSessionId } from "@/lib/commerce";
import { useAuthStore, type AuthUser } from "@/stores/authStore";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

const inputClass =
  "h-12 w-full rounded-2xl border border-[#eadfcd] bg-white pl-11 pr-4 text-[15px] text-[#3b3128] outline-none transition placeholder:text-[#bcae98] focus:border-[#c98a8f] focus:ring-4 focus:ring-[#e9b9bd]/40 disabled:opacity-60";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  );
}

function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const busy = submitting || redirecting;

  async function submit(formData: FormData) {
    setSubmitting(true);
    setError("");

    try {
      const payload = await publicFetch<LoginResponse>("/auth/login", {
        body: JSON.stringify({
          email: String(formData.get("email") ?? "").trim(),
          password: formData.get("password"),
        }),
        headers: { "X-Guest-Session-Id": getGuestSessionId() },
        method: "POST",
      });

      if (payload.user.type !== "customer") {
        setError("This is an admin account. Please use the admin login page.");
        return;
      }

      setSession(payload);
      setRedirecting(true);
      router.push(safeRedirect(searchParams.get("redirect")));
    } catch (caught) {
      setError(errorMessage(caught, "Login failed. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  const redirectQuery = searchParams.get("redirect");
  const registerHref = redirectQuery
    ? `/register?redirect=${encodeURIComponent(redirectQuery)}`
    : "/register";

  return (
    <main className="relative isolate overflow-hidden bg-[linear-gradient(160deg,#fff8ee_0%,#fbeee8_55%,#f7e3df_100%)]">
      {/* Soft decorative shapes */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <span className="absolute -left-24 top-10 size-72 rounded-full bg-[#f3d6d2]/60 blur-3xl" />
        <span className="absolute -right-20 bottom-0 size-80 rounded-full bg-[#f1deb0]/50 blur-3xl" />
        <span className="absolute left-[12%] top-[22%] size-2 rotate-45 bg-[#caa14e]/70" />
        <span className="absolute right-[14%] top-[30%] size-3 rotate-45 border border-[#caa14e]/70" />
        <span className="absolute bottom-[18%] left-[18%] size-3 rotate-45 border border-[#caa14e]/60" />
        <span className="absolute bottom-[26%] right-[22%] size-2 rotate-45 bg-[#d68b92]/60" />
      </div>

      <div className="mx-auto grid max-w-4xl items-center gap-2 px-4 py-6 lg:grid-cols-[1fr_minmax(0,28rem)] lg:gap-12 lg:py-14">
        <div className="mx-auto size-28 sm:size-32 lg:size-80">
          <TrustLottieIcon
            className="size-full drop-shadow-sm"
            fallback={
              <span className="grid size-full place-items-center rounded-full bg-[#f8e3df] text-[#6e1423]">
                <ShoppingBag aria-hidden="true" size={38} />
              </span>
            }
            src="/lottie/login-welcome.json"
          />
        </div>

        <div className="mx-auto w-full max-w-md lg:max-w-none">
          <div className="w-full rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-[0_20px_60px_-20px_rgba(110,20,35,0.25)] backdrop-blur sm:p-7">
            <div className="text-center">
              <h1 className="font-[family-name:var(--font-display)] text-[30px] font-medium leading-tight sm:text-[34px] text-[#3d1620]">
                Welcome back!
              </h1>
              <p className="mt-1.5 text-sm font-light leading-6 text-[#7a6c5c]">
                Sign in to track orders, checkout faster and keep your wishlist close.
              </p>
            </div>

            <form action={submit} className="mt-5">
              {error ? (
                <div
                  className="mb-4 flex items-start gap-2.5 rounded-2xl border border-[#f0c4bd] bg-[#fff1ee] px-3.5 py-3 text-sm text-[#8a1f12]"
                  role="alert"
                >
                  <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
                  <span>{error}</span>
                </div>
              ) : null}

              <label className="block text-[13px] font-medium text-[#5c5046]" htmlFor="login-email">
                Email
              </label>
              <div className="relative mt-1.5">
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b4a38a]"
                  size={17}
                />
                <input
                  autoComplete="email"
                  className={inputClass}
                  disabled={busy}
                  id="login-email"
                  inputMode="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  type="email"
                />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <label className="text-[13px] font-medium text-[#5c5046]" htmlFor="login-password">
                  Password
                </label>
                <Link
                  className="text-xs font-medium hover:underline"
                  href="/forgot-password"
                  style={{ color: "#a02a3c" }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <LockKeyhole
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b4a38a]"
                  size={17}
                />
                <input
                  autoComplete="current-password"
                  className={`${inputClass} pr-12`}
                  disabled={busy}
                  id="login-password"
                  name="password"
                  placeholder="Your password"
                  required
                  type={showPassword ? "text" : "password"}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-[#a39178] transition-colors hover:bg-[#f6ebe3] hover:text-[#6e1423]"
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" size={17} />
                  ) : (
                    <Eye aria-hidden="true" size={17} />
                  )}
                </button>
              </div>

              <button
                className="group mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#8a1c30,#6e1423)] text-[15px] font-medium tracking-wide text-white shadow-[0_10px_24px_-10px_rgba(110,20,35,0.7)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-10px_rgba(110,20,35,0.75)] active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={busy}
                type="submit"
              >
                {busy ? (
                  <>
                    <Loader2 aria-hidden="true" className="animate-spin" size={18} />
                    {redirecting ? "Taking you there..." : "Signing in..."}
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5"
                      size={17}
                    />
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-[#7a6c5c]">
              New here?{" "}
              <Link
                className="font-semibold hover:underline"
                href={registerHref}
                style={{ color: "#a02a3c" }}
              >
                Create an account
              </Link>
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-[#a39178]">
            Store team?{" "}
            <Link className="underline-offset-2 hover:underline" href="/admin/login">
              Admin login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

/** Only follow same-site paths so a crafted ?redirect= cannot send users elsewhere. */
function safeRedirect(value: string | null) {
  if (value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) {
    return value;
  }
  return "/checkout";
}
