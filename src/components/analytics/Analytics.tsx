"use client";

import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  CONSENT_EVENT,
  readConsent,
  saveConsent,
  sendVisitBeacon,
  type ConsentState,
} from "@/lib/analytics";
import { useAuthStore } from "@/stores/authStore";

/**
 * Cookie consent + GA4 loader. Nothing third-party loads until the visitor opts in; Google
 * Consent Mode defaults to "denied". The admin area never loads analytics.
 */
export function Analytics({ measurementId }: Readonly<{ measurementId: string }>) {
  const pathname = usePathname();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [consent, setConsent] = useState<ConsentState>({
    analytics: false,
    decided: true,
    marketing: false,
  });
  const [customising, setCustomising] = useState(false);
  const [draft, setDraft] = useState({ analytics: false, marketing: false });
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    setConsent(readConsent());
    const onChange = (event: Event) => setConsent((event as CustomEvent<ConsentState>).detail);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!isAdmin) sendVisitBeacon();
  }, [isAdmin]);

  // Page views for client-side navigations; the landing view is sent by the loader script.
  useEffect(() => {
    if (
      consent.analytics &&
      window.gtag &&
      measurementId &&
      window.__vastraLastPageView !== pathname
    ) {
      window.__vastraLastPageView = pathname;
      window.gtag("event", "page_view", {
        page_location: window.location.href,
        page_path: pathname,
      });
    }
  }, [consent.analytics, measurementId, pathname]);

  function decide(next: { analytics: boolean; marketing: boolean }) {
    saveConsent(next);
    setConsent({ ...next, decided: true });
    setCustomising(false);
    if (accessToken) {
      void apiFetch("/account/privacy/cookies", {
        body: JSON.stringify(next),
        method: "PATCH",
      }).catch(() => undefined);
    }
  }

  return (
    <>
      {measurementId && consent.analytics && !isAdmin ? (
        <>
          <Script id="ga-consent-default" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('consent','default',{ad_storage:'${consent.marketing ? "granted" : "denied"}',ad_user_data:'${consent.marketing ? "granted" : "denied"}',ad_personalization:'${consent.marketing ? "granted" : "denied"}',analytics_storage:'granted'});gtag('js',new Date());gtag('config','${measurementId}',{send_page_view:false,anonymize_ip:true});window.__vastraLastPageView=location.pathname;gtag('event','page_view',{page_location:location.href,page_path:location.pathname});`}
          </Script>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            strategy="afterInteractive"
          />
        </>
      ) : null}

      {!consent.decided && !isAdmin ? (
        <div
          aria-label="Cookie preferences"
          className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-3xl rounded-md border border-[#e5dac7] bg-[#fffaf1] p-4 text-sm text-[#3d1620] shadow-lg sm:inset-x-6"
          role="dialog"
        >
          {customising ? (
            <div className="grid gap-3">
              <p className="font-semibold">Choose which cookies we may use</p>
              <label className="flex items-start gap-2">
                <input checked disabled type="checkbox" />
                <span>
                  <strong>Essential</strong> — sign-in, cart and checkout. Always on.
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  checked={draft.analytics}
                  onChange={(event) => setDraft({ ...draft, analytics: event.target.checked })}
                  type="checkbox"
                />
                <span>
                  <strong>Analytics</strong> — anonymous usage statistics (Google Analytics) to
                  improve the store.
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  checked={draft.marketing}
                  onChange={(event) => setDraft({ ...draft, marketing: event.target.checked })}
                  type="checkbox"
                />
                <span>
                  <strong>Marketing</strong> — measure ads and campaigns.
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  className="h-10 rounded-md bg-primary px-4 font-semibold text-primary-foreground"
                  onClick={() => decide(draft)}
                  type="button"
                >
                  Save choices
                </button>
                <button
                  className="h-10 rounded-md border border-border px-4"
                  onClick={() => setCustomising(false)}
                  type="button"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="flex-1 leading-6">
                We use essential cookies to run the store and, with your permission, analytics
                cookies to improve it.{" "}
                <Link className="underline" href="/policies/privacy-policy">
                  Privacy policy
                </Link>
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="h-10 rounded-md border border-border px-3"
                  onClick={() => setCustomising(true)}
                  type="button"
                >
                  Customise
                </button>
                <button
                  className="h-10 rounded-md border border-border px-3"
                  onClick={() => decide({ analytics: false, marketing: false })}
                  type="button"
                >
                  Reject optional
                </button>
                <button
                  className="h-10 rounded-md bg-primary px-4 font-semibold text-primary-foreground"
                  onClick={() => decide({ analytics: true, marketing: true })}
                  type="button"
                >
                  Accept all
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}

/** Lets visitors reopen the banner (linked from the footer). */
export function reopenCookieSettings() {
  try {
    window.localStorage.removeItem("vastra-consent-v1");
  } catch {
    // ignore
  }
  window.dispatchEvent(
    new CustomEvent(CONSENT_EVENT, {
      detail: { analytics: false, decided: false, marketing: false },
    }),
  );
}
