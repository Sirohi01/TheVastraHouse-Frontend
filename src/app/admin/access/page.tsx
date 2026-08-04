"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  createAdminUser,
  fetchAccessControl,
  type AdminRole,
  type AdminUser,
  type LoginHistory,
  updateAdminUser,
} from "@/lib/accessControl";
import { useAuthStore } from "@/stores/authStore";

export default function AccessControlPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [history, setHistory] = useState<LoginHistory[]>([]);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    try {
      const [roleData, userData, historyData] = await fetchAccessControl(accessToken);
      setRoles(roleData.roles);
      setUsers(userData.users);
      setHistory(historyData.history);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Access data could not load");
    }
  }, [accessToken]);
  useEffect(() => {
    void load();
  }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<
      string,
      string
    >;
    try {
      await createAdminUser(data, accessToken);
      event.currentTarget.reset();
      setMessage("Admin user created");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Admin user could not be created");
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <main className="mx-auto grid max-w-7xl gap-5">
        <div>
          <h1 className="text-2xl font-semibold">Roles, users & login history</h1>
          <p className="text-sm text-muted-foreground">
            Only users with users/manage permission can access this workspace.
          </p>
        </div>
        {message ? <p className="text-sm font-semibold text-accent">{message}</p> : null}
        <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-5" onSubmit={create}>
          <input
            className="rounded-md border px-3 py-2"
            name="firstName"
            placeholder="First name"
            required
          />
          <input className="rounded-md border px-3 py-2" name="lastName" placeholder="Last name" />
          <input
            className="rounded-md border px-3 py-2"
            name="email"
            placeholder="Email"
            required
            type="email"
          />
          <input
            className="rounded-md border px-3 py-2"
            minLength={12}
            name="password"
            placeholder="Temporary password"
            required
            type="password"
          />
          <select className="rounded-md border px-3 py-2" name="roleSlug" required>
            {roles.map((role) => (
              <option key={role.slug} value={role.slug}>
                {role.name}
              </option>
            ))}
          </select>
          <button
            className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground md:col-span-5"
            type="submit"
          >
            Create admin user
          </button>
        </form>
        <section className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3">User</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr className="border-b" key={user._id}>
                  <td className="p-3">
                    <b>
                      {user.firstName} {user.lastName}
                    </b>
                    <br />
                    <span className="text-muted-foreground">{user.email}</span>
                  </td>
                  <td>
                    <select
                      className="rounded border p-2"
                      value={user.roleSlug}
                      onChange={async (e) => {
                        await updateAdminUser(user._id, { roleSlug: e.target.value }, accessToken);
                        await load();
                      }}
                    >
                      {roles.map((role) => (
                        <option key={role.slug} value={role.slug}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="rounded border p-2"
                      value={user.status}
                      onChange={async (e) => {
                        await updateAdminUser(user._id, { status: e.target.value }, accessToken);
                        await load();
                      }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Recent admin logins</h2>
          <div className="grid gap-2">
            {history.slice(0, 50).map((item) => (
              <div
                className="flex flex-wrap justify-between gap-2 border-b pb-2 text-sm"
                key={item._id}
              >
                <span>
                  {item.email} ·{" "}
                  {item.success ? "Success" : `Failed: ${item.failureReason ?? "unknown"}`}
                </span>
                <span className="text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString()} · {item.ipAddress ?? "unknown IP"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
