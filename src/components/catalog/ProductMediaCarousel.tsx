"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { MediaReference } from "@/lib/catalog";

export function ProductMediaCarousel({
  alt,
  media,
  sizes,
}: Readonly<{
  alt: string;
  media: MediaReference[];
  sizes: string;
}>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleMedia = media.filter((item) => item.type === "image" && item.url);

  useEffect(() => {
    setActiveIndex(0);
  }, [visibleMedia.length]);

  useEffect(() => {
    if (visibleMedia.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % visibleMedia.length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, [visibleMedia.length]);

  if (!visibleMedia.length) {
    return (
      <div className="grid aspect-[9/16] place-items-center bg-muted px-3 text-center text-sm font-semibold text-muted-foreground">
        {alt}
      </div>
    );
  }

  return (
    <div className="relative aspect-[9/16] overflow-hidden">
      {visibleMedia.map((item, index) => (
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === activeIndex ? "opacity-100" : "opacity-0"
          }`}
          key={item.mediaId ?? item.url}
        >
          <Image
            alt={item.altText ?? alt}
            className={item.objectFit === "contain" ? "object-contain" : "object-cover"}
            fill
            sizes={sizes}
            src={item.url}
          />
        </div>
      ))}
      {visibleMedia.length > 1 ? (
        <div className="absolute inset-x-0 bottom-2 z-10 flex justify-center gap-1.5">
          {visibleMedia.map((item, index) => (
            <span
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/65"
              }`}
              key={item.mediaId ?? item.url}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
