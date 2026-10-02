"use client";

import { CheckCircle, RefreshCw, Search, Trash2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmptyState } from "@/components/states/EmptyState";
import { errorMessage, useToast } from "@/components/ui/Toast";
import {
  deleteAdminReview,
  fetchAdminReviews,
  moderateAdminReview,
  type AdminReview,
} from "@/lib/reviewsAdmin";
import { useAuthStore } from "@/stores/authStore";

export default function AdminReviewsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const toast = useToast();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const payload = await fetchAdminReviews({ search, status }, accessToken);
      setReviews(payload.data);
    } catch (error) {
      toast.error(errorMessage(error, "Reviews could not be loaded"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (accessToken) void load();
  }, [accessToken, status]);

  async function moderate(id: string, moderationStatus: "approved" | "rejected" | "pending") {
    try {
      await moderateAdminReview(
        id,
        { moderationNote: note || undefined, moderationStatus },
        accessToken,
      );
      toast.success(`Review ${moderationStatus}`);
      setNote("");
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Review update failed"));
    }
  }

  async function remove(id: string) {
    try {
      await deleteAdminReview(id, accessToken);
      toast.success("Review deleted");
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Review delete failed"));
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <main className="mx-auto grid max-w-7xl gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Reviews moderation</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Approve, reject, or delete customer product reviews.
            </p>
          </div>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold"
            onClick={() => void load()}
            type="button"
          >
            <RefreshCw size={16} /> {loading ? "Loading" : "Refresh"}
          </button>
        </div>

        <section className="grid gap-3 rounded-md border border-border bg-card p-4 md:grid-cols-[180px_1fr_auto]">
          <select
            className="h-10 rounded-md border border-border px-3 text-sm"
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <input
            className="h-10 rounded-md border border-border px-3 text-sm"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search reviews"
            value={search}
          />
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            onClick={() => void load()}
            type="button"
          >
            <Search size={16} /> Search
          </button>
          <input
            className="h-10 rounded-md border border-border px-3 text-sm md:col-span-3"
            onChange={(event) => setNote(event.target.value)}
            placeholder="Moderation note for the next action"
            value={note}
          />
        </section>

        {reviews.length ? (
          <section className="grid gap-3">
            {reviews.map((review) => (
              <article className="rounded-md border border-border bg-card p-4" key={review._id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground">
                      {review.productId?.name ?? "Product"} · {review.rating}/5 ·{" "}
                      {review.moderationStatus}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">{review.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {review.userId?.email ?? "Customer"}{" "}
                      {review.createdAt ? `· ${new Date(review.createdAt).toLocaleString()}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-3 text-sm font-semibold"
                      onClick={() => void moderate(review._id, "approved")}
                      type="button"
                    >
                      <CheckCircle size={15} /> Approve
                    </button>
                    <button
                      className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-3 text-sm font-semibold"
                      onClick={() => void moderate(review._id, "rejected")}
                      type="button"
                    >
                      <XCircle size={15} /> Reject
                    </button>
                    <button
                      className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-3 text-sm font-semibold"
                      onClick={() => void remove(review._id)}
                      type="button"
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <EmptyState
            title="No reviews"
            message={loading ? "Loading..." : "No reviews match the current filters."}
          />
        )}
      </main>
    </ProtectedRoute>
  );
}
