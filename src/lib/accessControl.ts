import { apiFetch } from "@/lib/api";

export type AdminRole = { _id: string; name: string; slug: string };
export type AdminUser = {
  _id: string;
  email: string;
  firstName: string;
  lastName?: string;
  roleSlug: string;
  status: "active" | "inactive";
  createdAt: string;
};
export type LoginHistory = {
  _id: string;
  email: string;
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  createdAt: string;
};

export function fetchAccessControl(accessToken?: string) {
  return Promise.all([
    apiFetch<{ roles: AdminRole[] }>("/access-control/roles", { accessToken }),
    apiFetch<{ users: AdminUser[] }>("/access-control/users", { accessToken }),
    apiFetch<{ history: LoginHistory[] }>("/access-control/login-history", { accessToken }),
  ]);
}

export function createAdminUser(input: Record<string, string>, accessToken?: string) {
  return apiFetch<{ user: AdminUser }>("/access-control/users", {
    accessToken,
    body: JSON.stringify(input),
    method: "POST",
  });
}

export function updateAdminUser(
  id: string,
  input: { roleSlug?: string; status?: string },
  accessToken?: string,
) {
  return apiFetch<{ user: AdminUser }>(`/access-control/users/${id}`, {
    accessToken,
    body: JSON.stringify(input),
    method: "PATCH",
  });
}
