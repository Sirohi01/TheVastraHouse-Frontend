"use client";

import { apiBaseUrl } from "@/lib/api";

/**
 * Consent-aware analytics. GA4 only loads after the visitor accepts analytics cookies; every
 * helper below is a no-op until then. A first-party, identifier-free visit beacon feeds the
 * admin dashboard's conversion rate regardless of third-party consent.
 */
export type ConsentState = { analytics: boolean; marketing: boolean; decided: boolean };

const CONSENT_KEY = "vastra-consent-v1";
export const CONSENT_EVENT = "vastra:consent";

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

export function readConsent(): ConsentState {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ConsentState>;
      return { analytics: Boolean(parsed.analytics), decided: true, marketing: Boolean(parsed.marketing) };
    }
  } catch {
    // Storage unavailable (private mode): treat as undecided.
  }
  return { analytics: false, decided: false, marketing: false };
}

export function saveConsent(consent: Omit<ConsentState, "decided">) {
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // Non-fatal: the banner will ask again next visit.
  }
  window.gtag?.("consent", "update", {
    ad_personalization: consent.marketing ? "granted" : "denied",
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    analytics_storage: consent.analytics ? "granted" : "denied",
  });
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { ...consent, decided: true } }));
}

function analyticsAllowed() {
  return typeof window !== "undefined" && readConsent().analytics && typeof window.gtag === "function";
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (!analyticsAllowed()) return;
  window.gtag!("event", name, params);
}

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_variant?: string;
  item_category?: string;
  price: number;
  quantity?: number;
};

export function trackViewItem(item: AnalyticsItem) {
  trackEvent("view_item", { currency: "INR", items: [item], value: item.price });
}

export function trackAddToCart(item: AnalyticsItem) {
  trackEvent("add_to_cart", { currency: "INR", items: [item], value: item.price * (item.quantity ?? 1) });
}

export function trackAddToWishlist(item: AnalyticsItem) {
  trackEvent("add_to_wishlist", { currency: "INR", items: [item], value: item.price });
}

export function trackBeginCheckout(items: AnalyticsItem[], value: number, coupon?: string) {
  trackEvent("begin_checkout", { coupon, currency: "INR", items, value });
}

export function trackSearch(term: string) {
  if (term.trim().length >= 2) trackEvent("search", { search_term: term.trim() });
}

/** Purchase fires once per order even if the confirmation page is reloaded. */
export function trackPurchase(input: {
  transactionId: string;
  value: number;
  tax?: number;
  shipping?: number;
  coupon?: string;
  items: AnalyticsItem[];
}) {
  if (!analyticsAllowed()) return;
  const key = `vastra-purchase-${input.transactionId}`;
  try {
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
  } catch {
    // If storage is unavailable we still send once for this page view.
  }
  trackEvent("purchase", {
    coupon: input.coupon,
    currency: "INR",
    items: input.items,
    shipping: input.shipping,
    tax: input.tax,
    transaction_id: input.transactionId,
    value: input.value,
  });
}

/** Aggregate visit counter (no cookies/identifiers) for conversion-rate reporting. */
export function sendVisitBeacon() {
  try {
    if (window.sessionStorage.getItem("vastra-visit")) return;
    window.sessionStorage.setItem("vastra-visit", "1");
  } catch {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  let referrerHost: string | undefined;
  try {
    const referrer = document.referrer ? new URL(document.referrer) : undefined;
    referrerHost = referrer && referrer.host !== window.location.host ? referrer.host : undefined;
  } catch {
    referrerHost = undefined;
  }

  const body = JSON.stringify({
    medium: params.get("utm_medium") ?? undefined,
    referrerHost,
    source: params.get("utm_source") ?? undefined,
  });
  const url = `${apiBaseUrl}/engagement/visit`;

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
  } else {
    void fetch(url, { body, headers: { "Content-Type": "application/json" }, keepalive: true, method: "POST" }).catch(
      () => undefined,
    );
  }
}
