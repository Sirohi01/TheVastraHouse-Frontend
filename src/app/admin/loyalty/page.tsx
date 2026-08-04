"use client";

import { Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmptyState } from "@/components/states/EmptyState";
import { DataTable } from "@/components/ui/DataTable";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { errorMessage, useToast } from "@/components/ui/Toast";
import { fetchAdminGiftCards, issueAdminGiftCard, type AdminGiftCard } from "@/lib/loyalty";
import { useAuthStore } from "@/stores/authStore";

const blankForm = { balance: "", currencyCode: "INR", expiresAt: "", issuedToUserId: "" };

export default function AdminLoyaltyPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const toast = useToast();
  const [giftCards, setGiftCards] = useState<AdminGiftCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(blankForm);

  async function loadGiftCards() {
    setLoading(true);
    try {
      const payload = await fetchAdminGiftCards("1", accessToken);
      setGiftCards(payload.data);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load gift cards"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (accessToken) {
      void loadGiftCards();
    }
  }, [accessToken]);

  async function issueGiftCard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await issueAdminGiftCard(
        {
          balance: Number(form.balance),
          currencyCode: form.currencyCode,
          expiresAt: form.expiresAt || undefined,
          issuedToUserId: form.issuedToUserId || undefined,
        },
        accessToken,
      );
      toast.success("Gift card issued");
      setEditorOpen(false);
      setForm(blankForm);
      await loadGiftCards();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to issue gift card"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute>
      <section className="mx-auto max-w-7xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold">Loyalty &amp; Gift Cards</h1>
            <p className="text-sm text-muted-foreground">
              Issue gift cards manually. Reward points, store credit, and referrals are earned and
              redeemed automatically from checkout and returns — see a customer's balances via their
              order/return history.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-semibold"
              onClick={() => void loadGiftCards()}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={16} />
              Refresh
            </button>
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
              onClick={() => setEditorOpen(true)}
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
              Issue Gift Card
            </button>
          </div>
        </div>

        {giftCards.length ? (
          <DataTable
            columns={[
              { header: "Code", render: (item) => item.code },
              {
                header: "Balance",
                render: (item) => `${item.currencyCode} ${item.balance}`,
              },
              { header: "Status", render: (item) => item.status },
              {
                header: "Expires",
                render: (item) =>
                  item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : "-",
              },
              {
                header: "Issued",
                render: (item) => new Date(item.createdAt).toLocaleDateString(),
              },
            ]}
            emptyMessage={loading ? "Loading..." : "No gift cards yet."}
            getRowKey={(item) => item._id}
            rows={giftCards}
          />
        ) : (
          <EmptyState
            title="No gift cards"
            message={loading ? "Loading..." : "Issue the first gift card."}
          />
        )}

        <Modal onClose={() => setEditorOpen(false)} open={editorOpen} title="Issue gift card">
          <form onSubmit={issueGiftCard}>
            <div className="grid gap-3">
              <Field
                label="Balance"
                onChange={(value) => setForm((current) => ({ ...current, balance: value }))}
                required
                type="number"
                value={form.balance}
              />
              <Field
                label="Currency code"
                onChange={(value) => setForm((current) => ({ ...current, currencyCode: value }))}
                value={form.currencyCode}
              />
              <Field
                label="Issued to user ID (optional)"
                onChange={(value) => setForm((current) => ({ ...current, issuedToUserId: value }))}
                value={form.issuedToUserId}
              />
              <Field
                label="Expires at (optional)"
                onChange={(value) => setForm((current) => ({ ...current, expiresAt: value }))}
                type="date"
                value={form.expiresAt}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3">
              <button
                className="h-9 rounded-md border border-border px-3 text-sm font-semibold"
                disabled={saving}
                onClick={() => setEditorOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-9 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                disabled={saving}
                type="submit"
              >
                {saving ? "Issuing..." : "Issue"}
              </button>
            </div>
          </form>
        </Modal>
      </section>
    </ProtectedRoute>
  );
}
