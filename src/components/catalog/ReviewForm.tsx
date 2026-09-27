"use client";

import { ImagePlus, Send, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { authenticatedFetch, errorMessage, toApiError } from "@/lib/api";
import { submitReview } from "@/lib/catalog";
import { useAuthStore } from "@/stores/authStore";

type UploadedPhoto = { id: string; url: string };

/**
 * Review submission (FR-CAT-09). Reviews are tied to a signed-in customer so the server can
 * detect verified purchases, allow one review per product and prevent anonymous abuse.
 */
export function ReviewForm({ slug }: Readonly<{ slug: string }>) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string }>();

  if (!accessToken) {
    return (
      <p className="mt-5 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        <Link className="font-semibold text-primary underline" href={`/login?redirect=${encodeURIComponent(`/shop/${slug}#reviews`)}`}>
          Sign in
        </Link>{" "}
        to write a review. Reviews from customers who bought the item are marked as verified.
      </p>
    );
  }

  async function uploadPhoto(file: File) {
    if (photos.length >= 5) return;
    if (file.size > 8 * 1024 * 1024) {
      setMessage({ kind: "error", text: "Photos must be under 8 MB." });
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("context", "review-photo");
      form.set("aspectRatio", "1:1");
      form.set("altText", `Customer photo for ${slug.replace(/-/g, " ")}`);
      const response = await authenticatedFetch("/media/upload", { body: form, method: "POST" });
      if (!response.ok) throw await toApiError(response);
      const payload = (await response.json()) as { media: { _id: string; secureUrl: string } };
      setPhotos((current) => [...current, { id: payload.media._id, url: payload.media.secureUrl }]);
    } catch (error) {
      setMessage({ kind: "error", text: errorMessage(error, "Photo upload failed") });
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(undefined);

    try {
      await submitReview(slug, {
        body,
        photoMediaIds: photos.map((photo) => photo.id),
        rating,
        title: title || undefined,
      });
      setBody("");
      setTitle("");
      setPhotos([]);
      setMessage({ kind: "success", text: "Thank you! Your review will appear once our team approves it." });
    } catch (error) {
      setMessage({ kind: "error", text: errorMessage(error, "Review submission failed") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-5 grid gap-3 rounded-lg border border-border bg-card p-4" onSubmit={handleSubmit}>
      <h3 className="font-serif text-lg uppercase text-[#3d1620]">Write a review</h3>
      <fieldset>
        <legend className="text-xs font-semibold uppercase text-muted-foreground">Your rating</legend>
        <div className="mt-1 flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              aria-checked={rating === star}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
              className={`text-2xl leading-none ${star <= rating ? "text-[#caa14e]" : "text-[#e5dac7]"}`}
              key={star}
              onClick={() => setRating(star)}
              role="radio"
              type="button"
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>
      <label>
        <span className="text-xs font-semibold uppercase text-muted-foreground">Title (optional)</span>
        <input
          className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3"
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
          value={title}
        />
      </label>
      <label>
        <span className="text-xs font-semibold uppercase text-muted-foreground">Review</span>
        <textarea
          className="mt-1 min-h-28 w-full rounded-md border border-border bg-background p-3"
          maxLength={2000}
          minLength={10}
          onChange={(event) => setBody(event.target.value)}
          placeholder="How was the fit, fabric and finish?"
          required
          value={body}
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {photos.map((photo) => (
          <span className="relative" key={photo.id}>
            <Image alt="Your review upload" className="size-16 rounded-md border border-border object-cover" height={64} src={photo.url} width={64} />
            <button
              aria-label="Remove photo"
              className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-white shadow"
              onClick={() => setPhotos((current) => current.filter((item) => item.id !== photo.id))}
              type="button"
            >
              <X aria-hidden="true" size={12} />
            </button>
          </span>
        ))}
        {photos.length < 5 ? (
          <label className="inline-flex h-16 cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 text-xs font-semibold text-muted-foreground">
            <ImagePlus aria-hidden="true" size={16} />
            {uploading ? "Uploading…" : "Add photos"}
            <input
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadPhoto(file);
                event.target.value = "";
              }}
              type="file"
            />
          </label>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {message ? (
          <p className={`text-sm font-semibold ${message.kind === "error" ? "text-destructive" : "text-emerald-700"}`} role="status">
            {message.text}
          </p>
        ) : (
          <span />
        )}
        <button
          className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          disabled={submitting || uploading}
          type="submit"
        >
          <Send aria-hidden="true" size={16} />
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </div>
    </form>
  );
}
