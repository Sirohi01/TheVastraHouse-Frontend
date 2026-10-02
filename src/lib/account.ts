"use client";

import { apiFetch } from "@/lib/api";
import type { AuthUser } from "@/stores/authStore";

export type AccountAddress = {
  _id: string;
  label?: string;
  fullName: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  phone: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
};

export type AccountOverview = {
  addressesCount: number;
  customer: AuthUser & {
    createdAt?: string;
    rewardPointsBalance?: number;
    storeCreditBalance?: number;
    lifetimeOrderValue?: number;
  };
  giftCardBalance: number;
  tier?: { name?: string; multiplier?: number; nextTier?: string; progressPercent?: number };
};

export type RewardSummary = {
  creditHistory: Array<{ _id: string; amount: number; reason?: string; createdAt: string }>;
  giftCards: Array<{
    _id: string;
    code: string;
    balance: number;
    status: string;
    expiresAt?: string;
  }>;
  pointsHistory: Array<{ _id: string; points: number; reason?: string; createdAt: string }>;
  referral: { code: string; link: string; rewardAmount: number };
  rewardPoints: number;
  storeCredit: number;
  tier?: { name?: string; nextTier?: string; progressPercent?: number };
};

export type AuthSession = {
  _id: string;
  createdAt: string;
  lastUsedAt?: string;
  userAgent?: string;
  ipAddress?: string;
};

export type PrivacyRequest = {
  _id: string;
  requestNumber: string;
  type: string;
  status: string;
  createdAt: string;
};

export function fetchAccountOverview(accessToken?: string) {
  return apiFetch<AccountOverview>("/account/overview", { accessToken });
}

export function fetchAddresses(accessToken?: string) {
  return apiFetch<{ addresses: AccountAddress[] }>("/account/addresses", { accessToken });
}

export function saveAddress(
  address: Omit<AccountAddress, "_id">,
  id?: string,
  accessToken?: string,
) {
  return apiFetch<{ addresses: AccountAddress[] }>(
    id ? `/account/addresses/${id}` : "/account/addresses",
    {
      accessToken,
      body: JSON.stringify(address),
      method: id ? "PATCH" : "POST",
    },
  );
}

export function deleteAddress(id: string, accessToken?: string) {
  return apiFetch<{ addresses: AccountAddress[] }>(`/account/addresses/${id}`, {
    accessToken,
    method: "DELETE",
  });
}

export function fetchRewards(accessToken?: string) {
  return apiFetch<RewardSummary>("/account/rewards", { accessToken });
}

export function updateProfile(
  payload: Pick<AuthUser, "firstName" | "lastName" | "phone">,
  accessToken?: string,
) {
  return apiFetch<{ user: AuthUser }>("/auth/me", {
    accessToken,
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function updatePreferences(
  payload: NonNullable<AuthUser["notificationPreferences"]> & { whatsappOptIn: boolean },
  accessToken?: string,
) {
  return apiFetch<{ user: AuthUser }>("/auth/me/preferences", {
    accessToken,
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function fetchSessions(accessToken?: string) {
  return apiFetch<{ sessions: AuthSession[] }>("/auth/sessions", { accessToken });
}

export function revokeSession(id: string, accessToken?: string) {
  return apiFetch<{ revoked: boolean }>(`/auth/sessions/${id}`, { accessToken, method: "DELETE" });
}

export function fetchPrivacyRequests(accessToken?: string) {
  return apiFetch<{ requests: PrivacyRequest[] }>("/account/privacy/requests", { accessToken });
}

export function requestPrivacyExport(stepUpToken: string, accessToken?: string) {
  return apiFetch<{ request: PrivacyRequest }>("/account/privacy/export", {
    accessToken,
    body: JSON.stringify({ stepUpToken }),
    method: "POST",
  });
}
