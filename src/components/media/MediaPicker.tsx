"use client";

import { Check, ImageIcon } from "lucide-react";
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
  selectedIds = [],
}: Readonly<{
  media: MediaItem[];
  multiSelect?: boolean;
  onSelect: (media: MediaItem) => void;
  selectedIds?: string[];
}>) {
  if (!media.length) {
    return <EmptyState title="No media" message="Upload assets to use them here." />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {media.map((item) => (
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
  );
}
