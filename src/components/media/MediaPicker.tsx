"use client";

import { Check, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

export function MediaPicker({
  media,
  multiSelect = false,
  onSelect,
  pageSize = 12,
  selectedIds = [],
}: Readonly<{
  media: MediaItem[];
  multiSelect?: boolean;
  onSelect: (media: MediaItem) => void;
  pageSize?: number;
  selectedIds?: string[];
}>) {
  const [page, setPage] = useState(1);
  const mediaSignature = media.map((item) => item._id).join(",");
  const orderedMedia = useMemo(
    () =>
      [...media].sort((left, right) => aspectPriority(left.selectedAspectRatio) - aspectPriority(right.selectedAspectRatio)),
    [media],
  );
  const totalPages = Math.max(1, Math.ceil(orderedMedia.length / pageSize));
  const visibleMedia = orderedMedia.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [mediaSignature]);

  if (!media.length) {
    return <EmptyState title="No media" message="Upload assets to use them here." />;
  }

  return (
    <div className="grid gap-3">
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
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, orderedMedia.length)} of {orderedMedia.length}
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
