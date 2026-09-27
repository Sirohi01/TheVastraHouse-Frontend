"use client";

import { apiFetch } from "@/lib/api";

export type AdminRecord = Record<string, string | number | boolean | null | undefined>;

export function fetchMarketingWorkspace(accessToken?: string) {
  return Promise.all([
    apiFetch<{ data?: AdminRecord[]; coupons?: AdminRecord[] }>("/marketing/coupons", { accessToken }),
    apiFetch<{ data?: AdminRecord[]; campaigns?: AdminRecord[] }>("/marketing/campaigns", { accessToken }),
    apiFetch<{ data?: AdminRecord[]; subscribers?: AdminRecord[] }>("/marketing/newsletter", { accessToken }),
    apiFetch<{ data?: AdminRecord[]; subscriptions?: AdminRecord[] }>("/marketing/back-in-stock", { accessToken }),
  ]);
}

export function createCoupon(payload: AdminRecord, accessToken?: string) {
  return apiFetch("/marketing/coupons", {
    accessToken,
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function createCampaign(payload: AdminRecord, accessToken?: string) {
  return apiFetch("/marketing/campaigns", {
    accessToken,
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function fetchCrmWorkspace(accessToken?: string) {
  return Promise.all([
    apiFetch<{ data?: AdminRecord[]; customers?: AdminRecord[] }>("/crm/customers", { accessToken }),
    apiFetch<{ data?: AdminRecord[]; applications?: AdminRecord[] }>("/crm/wholesale", { accessToken }),
    apiFetch<{ data?: AdminRecord[]; tickets?: AdminRecord[] }>("/crm/tickets", { accessToken }),
    apiFetch<{ data?: AdminRecord[]; requests?: AdminRecord[] }>("/crm/privacy-requests", { accessToken }),
  ]);
}

export function updateWholesale(id: string, status: "approved" | "rejected", accessToken?: string) {
  return apiFetch(`/crm/wholesale/${id}/${status}`, { accessToken, method: "POST" });
}

export function fetchSeoWorkspace(accessToken?: string) {
  return Promise.all([
    apiFetch<{ settings?: AdminRecord }>("/content/admin/seo", { accessToken }),
    apiFetch<{ audit?: AdminRecord[] }>("/content/admin/seo/audit", { accessToken }),
    apiFetch<{ redirects?: AdminRecord[] }>("/content/admin/redirects", { accessToken }),
  ]);
}

export function saveSeoSettings(payload: AdminRecord, accessToken?: string) {
  return apiFetch("/content/admin/seo", {
    accessToken,
    body: JSON.stringify(payload),
    method: "PUT",
  });
}

export function createRedirect(payload: AdminRecord, accessToken?: string) {
  return apiFetch("/content/admin/redirects", {
    accessToken,
    body: JSON.stringify(payload),
    method: "POST",
  });
}
