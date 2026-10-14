"use client";

import { Check, ChevronLeft, ChevronRight, ImageIcon, Loader2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { errorMessage, useToast } from "@/components/ui/Toast";
import { apiBaseUrl } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { EmptyState } from "@/components/states/EmptyState";
import { ResponsiveImage } from "./ResponsiveImage";

export type MediaItem = {
  _id: string;
  originalUrl?: string;
  secureUrl: string;
  altText?: string;
  selectedAspectRatio: string;
  resourceType: "image" | "video" | "raw";
};

const uploadRatios = [
  "16:4",
  "16:4.4",
  "16:5",
  "16:7",
  "16:9",
  "21:9",
  "4:5",
  "9:16",
  "1:1",
  "3:2",
  "2:3",
];

export type MediaPickerUpload = {
  /** Default aspect ratio for new uploads (the admin can change it before choosing a file). */
  aspectRatio?: string;
  /** Alt text for the new image. Falls back to the file name. */
  altText?: string;
  /** Called after a successful upload so the parent can refresh its library list. */
  onUploaded?: (media: MediaItem) => void;
  tags?: string;
};

export function MediaPicker({
  media,
  multiSelect = false,
  onSelect,
  pageSize = 12,
  selectedIds = [],
  upload,
}: Readonly<{
  media: MediaItem[];
  multiSelect?: boolean;
  onSelect: (media: MediaItem) => void;
  pageSize?: number;
  selectedIds?: string[];
  /** When set, shows a direct upload control above the library; the new file is selected. */
  upload?: MediaPickerUpload;
}>) {
  const [page, setPage] = useState(1);
  const mediaSignature = media.map((item) => item._id).join(",");
  const orderedMedia = useMemo(
    () =>
      [...media].sort(
        (left, right) =>
          aspectPriority(left.selectedAspectRatio) - aspectPriority(right.selectedAspectRatio),
      ),
    [media],
  );
  const totalPages = Math.max(1, Math.ceil(orderedMedia.length / pageSize));
  const visibleMedia = orderedMedia.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [mediaSignature]);

  if (!media.length) {
    return (
      <div className="grid gap-3">
        {upload ? <DirectUpload onSelect={onSelect} upload={upload} /> : null}
        <EmptyState title="No media" message="Upload assets to use them here." />
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {upload ? <DirectUpload onSelect={onSelect} upload={upload} /> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {visibleMedia.map((item) => (
          <button
            aria-pressed={multiSelect ? selectedIds.includes(item._id) : undefined}
            className={`relative rounded-lg border bg-card p-2 text-left transition hover:border-primary ${
              selectedIds.includes(item._id)
                ? "border-primary ring-2 ring-primary/20"
                : "border-border"
            }`}
            key={item._id}
            onClick={() => onSelect(item)}
            type="button"
          >
            {multiSelect && selectedIds.includes(item._id) ? (
              <span className="absolute right-3 top-3 z-10 inline-flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Check aria-hidden="true" size={15} />
              </span>
            ) : null}
            {item.resourceType === "image" ? (
              <ResponsiveImage
                alt={item.altText ?? "Media asset"}
                aspectRatio={item.selectedAspectRatio.replace(":", " / ")}
                src={item.secureUrl}
              />
            ) : item.resourceType === "video" ? (
              <div className="relative aspect-square overflow-hidden bg-black">
                <video
                  aria-label={item.altText ?? "Video asset"}
                  className="size-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  src={item.secureUrl}
                />
                <span className="absolute bottom-2 left-2 rounded-sm bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase text-white">
                  Video
                </span>
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center bg-muted text-muted-foreground">
                <ImageIcon aria-hidden="true" />
              </div>
            )}
          </button>
        ))}
      </div>
      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <span>
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, orderedMedia.length)} of{" "}
            {orderedMedia.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous media page"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={14} />
              Previous
            </button>
            <span className="font-medium text-foreground">
              {page} / {totalPages}
            </span>
            <button
              aria-label="Next media page"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page === totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              type="button"
            >
              Next
              <ChevronRight aria-hidden="true" size={14} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function aspectPriority(aspectRatio?: string) {
  const normalized = aspectRatio?.replaceAll(" ", "") ?? "";
  if (normalized === "16:7" || normalized === "16/7") return 0;
  if (normalized === "9:16" || normalized === "9/16") return 1;
  return 2;
}

function DirectUpload({
  onSelect,
  upload,
}: Readonly<{ onSelect: (media: MediaItem) => void; upload: MediaPickerUpload }>) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [ratio, setRatio] = useState(upload.aspectRatio ?? "16:4.4");
  const [uploading, setUploading] = useState(false);
  const ratios = uploadRatios.includes(ratio) ? uploadRatios : [ratio, ...uploadRatios];

  async function send(file: File) {
    setUploading(true);
    try {
      const baseName = file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]+/g, " ")
        .trim();
      const altText = upload.altText?.trim() ?? "";
      const formData = new FormData();
      formData.set("file", file);
      formData.set("aspectRatio", ratio);
      formData.set("context", "product-media");
      formData.set("objectFit", "cover");
      formData.set(
        "altText",
        altText.length >= 3 ? altText : baseName.length >= 3 ? baseName : "The Vastra House banner",
      );
      formData.set("tags", upload.tags ?? "cms");

      const response = await fetch(`${apiBaseUrl}/media/upload`, {
        body: formData,
        headers: { Authorization: `Bearer ${accessToken}` },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "Upload failed");
      }

      const payload = (await response.json()) as { media: MediaItem };
      onSelect(payload.media);
      upload.onUploaded?.(payload.media);
      toast.success("Image uploaded and selected");
    } catch (error) {
      toast.error(errorMessage(error, "Upload failed"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-border bg-muted/40 p-3">
      <label className="text-xs font-medium">
        Aspect ratio
        <select
          className="mt-1 block h-9 rounded-md border border-border bg-background px-2 text-sm"
          disabled={uploading}
          onChange={(event) => setRatio(event.target.value)}
          value={ratio}
        >
          {ratios.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <input
        accept="image/*"
        className="sr-only"
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void send(file);
        }}
        ref={fileRef}
        type="file"
      />
      <button
        className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        type="button"
      >
        {uploading ? (
          <Loader2 aria-hidden="true" className="animate-spin" size={15} />
        ) : (
          <Upload aria-hidden="true" size={15} />
        )}
        {uploading ? "Uploading..." : "Upload new image"}
      </button>
    </div>
  );
}
