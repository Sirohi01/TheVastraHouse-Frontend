"use client";

import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  LockKeyhole,
  Mail,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { errorMessage, publicFetch } from "@/lib/api";
import { getGuestSessionId } from "@/lib/commerce";
import { useAuthStore, type AuthUser } from "@/stores/authStore";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

// Fine gold lattice on deep maroon, shared with the footer.
const JAALI_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='%23d8b66d' stroke-opacity='0.12' stroke-width='1'%3E%3Cpath d='M28 4l24 24-24 24L4 28z'/%3E%3Cpath d='M28 16l12 12-12 12-12-12z'/%3E%3Ccircle cx='28' cy='28' r='3'/%3E%3C/g%3E%3C/svg%3E")`;

const perks = [
  { icon: PackageCheck, text: "Track every order in one place" },
  { icon: ShoppingBag, text: "Faster checkout with saved details" },
  { icon: Heart, text: "Wishlist and cart synced everywhere" },
];

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    // Controlled by JS (not a form action) so the typed email survives a failed attempt.
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
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
    <main className="bg-[#fbf7ef]">
      <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl lg:grid-cols-[1.05fr_1fr]">
        {/* Brand panel */}
        <aside
          className="relative hidden flex-col justify-between overflow-hidden px-12 py-14 text-[#f6ecda] lg:flex"
          style={{
            backgroundColor: "#3a0f19",
            backgroundImage: `radial-gradient(ellipse 80% 55% at 50% 0%, rgba(122,31,43,0.6), transparent 70%), ${JAALI_PATTERN}`,
          }}
        >
          <div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,transparent,#caa14e,#f0d9a4,#caa14e,transparent)]" />
          <div>
            <p className="font-[family-name:var(--font-display)] text-4xl font-medium uppercase tracking-[0.28em] text-[#e6c67a]">
              Vastra
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.7em] text-[#d8b66d]">House</p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#d8b66d]">Welcome back</p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-medium uppercase leading-[1.05] tracking-[0.02em]">
              Indian roots.
              <br />
              Modern form.
            </h1>
            <ul className="mt-8 grid gap-4 text-sm font-light">
              {perks.map(({ icon: Icon, text }) => (
                <li className="flex items-center gap-3" key={text}>
                  <span className="grid size-9 place-items-center rounded-full border border-[#caa14e]/60 text-[#e6c67a]">
                    <Icon aria-hidden="true" size={16} />
                  </span>
                  <span className="text-[#f6ecda]/85">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-[#d9c9ae]/80">The Vastra House</p>
        </aside>

        {/* Form */}
        <section className="flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <Link
                className="mb-5 inline-block font-[family-name:var(--font-display)] text-2xl font-medium uppercase tracking-[0.24em] text-[#7a5a34] lg:hidden"
                href="/"
              >
                Vastra House
              </Link>
              <p className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[#9b6d35] lg:justify-start">
                <span className="hidden h-px w-6 bg-[#caa14e] lg:inline-block" />
                Customer login
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-medium uppercase tracking-[0.04em] text-[#3d1620]">
                Sign in
              </h2>
              <p className="mt-2 text-sm font-light text-[#6f6256]">
                Sign in to checkout, track orders and keep your cart synced.
              </p>
            </div>

            <form
              onSubmit={submit}
              className="rounded-sm border border-[#e5dac7] border-t-[3px] border-t-[#caa14e] bg-[#fffaf1] p-6 shadow-soft sm:p-8"
            >
              {error ? (
                <div
                  className="mb-5 flex items-start gap-2.5 rounded-sm border border-[#e7b9b2] bg-[#fdf0ee] px-3.5 py-3 text-sm text-[#8a1f12]"
                  role="alert"
                >
                  <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
                  <span>{error}</span>
                </div>
              ) : null}

              <label className="block text-sm font-medium text-[#3b3128]" htmlFor="login-email">
                Email
              </label>
              <div className="relative mt-2">
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b8b76]"
                  size={17}
                />
                <input
                  autoComplete="email"
                  className="h-12 w-full rounded-sm border border-[#d9ccb6] bg-white pl-11 pr-3 text-sm outline-none transition placeholder:text-[#b4a690] focus:border-[#7a1f2b] focus:ring-2 focus:ring-[#7a1f2b]/15 disabled:opacity-60"
                  disabled={busy}
                  id="login-email"
                  inputMode="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  type="email"
                />
              </div>

              <div className="mt-5 flex items-center justify-between">
                <label className="text-sm font-medium text-[#3b3128]" htmlFor="login-password">
                  Password
                </label>
                <Link
                  className="text-xs font-medium text-[#7a1f2b] hover:underline"
                  href="/forgot-password"
                  style={{ color: "#7a1f2b" }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-2">
                <LockKeyhole
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b8b76]"
                  size={17}
                />
                <input
                  autoComplete="current-password"
                  className="h-12 w-full rounded-sm border border-[#d9ccb6] bg-white pl-11 pr-12 text-sm outline-none transition placeholder:text-[#b4a690] focus:border-[#7a1f2b] focus:ring-2 focus:ring-[#7a1f2b]/15 disabled:opacity-60"
                  disabled={busy}
                  id="login-password"
                  name="password"
                  placeholder="Enter your password"
                  required
                  type={showPassword ? "text" : "password"}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-sm text-[#8a7b66] transition-colors hover:bg-[#f1e7d6] hover:text-[#3d1620]"
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
                className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-[#6e1423] text-sm font-medium uppercase tracking-[0.18em] text-white transition hover:bg-[#84182c] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={busy}
                type="submit"
              >
                {busy ? (
                  <>
                    <Loader2 aria-hidden="true" className="animate-spin" size={17} />
                    {redirecting ? "Redirecting..." : "Signing in..."}
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight aria-hidden="true" size={16} />
                  </>
                )}
              </button>

              <p className="mt-6 text-center text-sm text-[#6f6256]">
                New to The Vastra House?{" "}
                <Link
                  className="font-semibold text-[#7a1f2b] hover:underline"
                  href={registerHref}
                  style={{ color: "#7a1f2b" }}
                >
                  Create account
                </Link>
              </p>
            </form>

            <p className="mt-5 text-center text-xs text-[#9b8b76]">
              Store team?{" "}
              <Link
                className="underline-offset-2 hover:text-[#7a1f2b] hover:underline"
                href="/admin/login"
              >
                Admin login
              </Link>
            </p>
          </div>
        </section>
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
