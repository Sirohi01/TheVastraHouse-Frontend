"use client";

import { apiFetch } from "@/lib/api";
import type { PaginatedResult } from "@/lib/catalog";

export type AdminReview = {
  _id: string;
  title: string;
  body: string;
  rating: number;
  moderationStatus: "pending" | "approved" | "rejected";
  moderationNote?: string;
  createdAt?: string;
  productId?: { name?: string; slug?: string };
  userId?: { email?: string; firstName?: string; lastName?: string };
};

export function fetchAdminReviews(input: { status?: string; search?: string }, accessToken?: string) {
  const params = new URLSearchParams();
  if (input.status) params.set("moderationStatus", input.status);
  if (input.search) params.set("search", input.search);
  return apiFetch<PaginatedResult<AdminReview>>(`/catalog/admin/reviews?${params.toString()}`, { accessToken });
}

export function moderateAdminReview(
  id: string,
  payload: { moderationStatus: "pending" | "approved" | "rejected"; moderationNote?: string },
  accessToken?: string,
) {
  return apiFetch<{ review: AdminReview }>(`/catalog/admin/reviews/${id}`, {
    accessToken,
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function deleteAdminReview(id: string, accessToken?: string) {
  return apiFetch<{ deleted: boolean }>(`/catalog/admin/reviews/${id}`, { accessToken, method: "DELETE" });
}
