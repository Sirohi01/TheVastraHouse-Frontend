import { apiFetch } from "@/lib/api";
import type { PaginatedResult } from "@/lib/catalog";

export type NotificationChannel = "email" | "whatsapp";

export type NotificationTemplate = {
  _id: string;
  eventType: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  active: boolean;
};

export type NotificationLogEntry = {
  _id: string;
  eventType: string;
  channel: NotificationChannel;
  to: string;
  subject?: string;
  status: "sent" | "failed" | "skipped";
  error?: string;
  createdAt: string;
};

export function fetchNotificationTemplates(accessToken?: string) {
  return apiFetch<{ templates: NotificationTemplate[] }>("/notifications/admin/templates", {
    accessToken,
  });
}

export function saveNotificationTemplate(
  payload: {
    eventType: string;
    channel: NotificationChannel;
    subject?: string;
    body: string;
    active: boolean;
  },
  accessToken?: string,
) {
  return apiFetch<{ template: NotificationTemplate }>("/notifications/admin/templates", {
    accessToken,
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function updateNotificationTemplate(
  id: string,
  payload: Partial<{
    eventType: string;
    channel: NotificationChannel;
    subject?: string;
    body: string;
    active: boolean;
  }>,
  accessToken?: string,
) {
  return apiFetch<{ template: NotificationTemplate }>(`/notifications/admin/templates/${id}`, {
    accessToken,
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function deleteNotificationTemplate(id: string, accessToken?: string) {
  return apiFetch<{ deleted: boolean }>(`/notifications/admin/templates/${id}`, {
    accessToken,
    method: "DELETE",
  });
}

export function fetchNotificationLog(
  query: { eventType?: string; status?: string; page?: string } = {},
  accessToken?: string,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value) {
      params.set(key, value);
    }
  }

  const queryString = params.toString();
  return apiFetch<PaginatedResult<NotificationLogEntry>>(
    `/notifications/admin/log${queryString ? `?${queryString}` : ""}`,
    { accessToken },
  );
}
