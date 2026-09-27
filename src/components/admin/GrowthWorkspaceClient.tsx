"use client";

import { Megaphone, RefreshCw, Save, Search, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Field } from "@/components/ui/Field";
import { errorMessage, useToast } from "@/components/ui/Toast";
import {
  createCampaign,
  createCoupon,
  createRedirect,
  fetchCrmWorkspace,
  fetchMarketingWorkspace,
  fetchSeoWorkspace,
  saveSeoSettings,
  updateWholesale,
  type AdminRecord,
} from "@/lib/adminGrowth";
import { useAuthStore } from "@/stores/authStore";

type Workspace = "crm" | "marketing" | "seo";

export function GrowthWorkspaceClient({ workspace }: Readonly<{ workspace: Workspace }>) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const toast = useToast();
  const [sections, setSections] = useState<Array<{ label: string; rows: AdminRecord[] }>>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      if (workspace === "marketing") {
        const [coupons, campaigns, newsletter, backInStock] = await fetchMarketingWorkspace(accessToken);
        setSections([
          { label: "Coupons", rows: normalizeRows(coupons.coupons ?? coupons.data) },
          { label: "Campaigns", rows: normalizeRows(campaigns.campaigns ?? campaigns.data) },
          { label: "Newsletter", rows: normalizeRows(newsletter.subscribers ?? newsletter.data) },
          { label: "Back in stock", rows: normalizeRows(backInStock.subscriptions ?? backInStock.data) },
        ]);
      }
      if (workspace === "crm") {
        const [customers, wholesale, tickets, privacy] = await fetchCrmWorkspace(accessToken);
        setSections([
          { label: "Customers", rows: normalizeRows(customers.customers ?? customers.data) },
          { label: "Wholesale approvals", rows: normalizeRows(wholesale.applications ?? wholesale.data) },
          { label: "Support tickets", rows: normalizeRows(tickets.tickets ?? tickets.data) },
          { label: "Privacy requests", rows: normalizeRows(privacy.requests ?? privacy.data) },
        ]);
      }
      if (workspace === "seo") {
        const [settings, audit, redirects] = await fetchSeoWorkspace(accessToken);
        setSections([
          { label: "Global settings", rows: [settings.settings ?? {}] },
          { label: "SEO audit", rows: normalizeRows(audit.audit) },
          { label: "Redirects", rows: normalizeRows(redirects.redirects) },
        ]);
      }
    } catch (error) {
      toast.error(errorMessage(error, "Workspace could not be loaded"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (accessToken) void load();
  }, [accessToken, workspace]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (workspace === "marketing" && form.kind === "campaign") {
        await createCampaign(form, accessToken);
      } else if (workspace === "marketing") {
        await createCoupon(form, accessToken);
      } else if (workspace === "seo" && form.kind === "redirect") {
        await createRedirect(form, accessToken);
      } else if (workspace === "seo") {
        await saveSeoSettings(form, accessToken);
      }
      toast.success("Saved");
      setForm({});
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Save failed"));
    }
  }

  const title = workspace === "crm" ? "CRM & service" : workspace === "seo" ? "SEO operations" : "Marketing";
  const Icon = workspace === "crm" ? Users : workspace === "seo" ? Search : Megaphone;

  return (
    <ProtectedRoute adminOnly>
      <main className="mx-auto grid max-w-7xl gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold"><Icon size={22} /> {title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Live data from the backend APIs. Changes save directly to the server.</p>
          </div>
          <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold" onClick={() => void load()} type="button">
            <RefreshCw size={16} /> {loading ? "Loading" : "Refresh"}
          </button>
        </div>

        {workspace !== "crm" ? (
          <form className="grid gap-3 rounded-md border border-border bg-card p-4 md:grid-cols-4" onSubmit={submit}>
            {workspace === "marketing" ? (
              <>
                <Field label="Kind" onChange={(value) => setForm((current) => ({ ...current, kind: value }))} value={form.kind ?? "coupon"} />
                <Field label="Code / Name" onChange={(value) => setForm((current) => ({ ...current, code: value, name: value, title: value }))} required value={form.code ?? ""} />
                <Field label="Discount / Subject" onChange={(value) => setForm((current) => ({ ...current, discountValue: value, subject: value }))} value={form.discountValue ?? ""} />
              </>
            ) : (
              <>
                <Field label="Kind" onChange={(value) => setForm((current) => ({ ...current, kind: value }))} value={form.kind ?? "settings"} />
                <Field label="Source / Title" onChange={(value) => setForm((current) => ({ ...current, fromPath: value, titleTemplate: value }))} value={form.fromPath ?? ""} />
                <Field label="Target / Description" onChange={(value) => setForm((current) => ({ ...current, toPath: value, defaultDescription: value }))} value={form.toPath ?? ""} />
              </>
            )}
            <button className="inline-flex h-10 self-end items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground" type="submit">
              <Save size={16} /> Save
            </button>
          </form>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          {sections.map((section) => (
            <section className="rounded-md border border-border bg-card p-4" key={section.label}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><ShieldCheck size={18} /> {section.label}</h2>
              <div className="grid gap-2">
                {section.rows.length ? section.rows.slice(0, 12).map((row, index) => (
                  <RecordRow accessToken={accessToken} key={`${section.label}-${String(row._id ?? index)}`} onChanged={load} row={row} section={section.label} />
                )) : <p className="text-sm text-muted-foreground">No records returned.</p>}
              </div>
            </section>
          ))}
        </div>
      </main>
    </ProtectedRoute>
  );
}

function RecordRow({ accessToken, onChanged, row, section }: Readonly<{ accessToken?: string; onChanged: () => Promise<void>; row: AdminRecord; section: string }>) {
  const toast = useToast();
  const id = String(row._id ?? row.id ?? "");
  const title = String((row.name ?? row.title ?? row.code ?? row.email ?? row.ticketNumber ?? row.requestNumber ?? id) || "Record");
  return (
    <div className="rounded-md border border-border p-3 text-sm">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 truncate text-muted-foreground">{Object.entries(row).slice(0, 5).map(([key, value]) => `${key}: ${String(value)}`).join(" · ")}</p>
      {section === "Wholesale approvals" && id ? (
        <div className="mt-2 flex gap-2">
          {(["approved", "rejected"] as const).map((status) => (
            <button className="rounded-md border border-border px-2 py-1 text-xs font-semibold" key={status} onClick={async () => { try { await updateWholesale(id, status, accessToken); await onChanged(); } catch (error) { toast.error(errorMessage(error, "Wholesale update failed")); } }} type="button">
              {status}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function normalizeRows(rows: AdminRecord[] | undefined) {
  return Array.isArray(rows) ? rows : [];
}
