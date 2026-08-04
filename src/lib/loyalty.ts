import { apiFetch } from "@/lib/api";
import type { PaginatedResult } from "@/lib/catalog";

export type LoyaltySummary = {
  referralCode: string;
  rewardPoints: number;
  storeCreditBalance: number;
  tier: "standard" | "silver" | "gold" | "platinum";
};

export function fetchLoyaltySummary(accessToken?: string) {
  return apiFetch<LoyaltySummary>("/loyalty/me", { accessToken });
}

export type AdminGiftCard = {
  _id: string;
  code: string;
  balance: number;
  currencyCode: string;
  status: "active" | "disabled" | "expired";
  issuedToUserId?: string;
  expiresAt?: string;
  createdAt: string;
};

export function fetchAdminGiftCards(page = "1", accessToken?: string) {
  return apiFetch<PaginatedResult<AdminGiftCard>>(`/loyalty/admin/gift-cards?page=${page}`, {
    accessToken,
  });
}

export function issueAdminGiftCard(
  payload: { balance: number; currencyCode?: string; issuedToUserId?: string; expiresAt?: string },
  accessToken?: string,
) {
  return apiFetch<{ giftCard: AdminGiftCard }>("/loyalty/admin/gift-cards", {
    accessToken,
    body: JSON.stringify(payload),
    method: "POST",
  });
}
