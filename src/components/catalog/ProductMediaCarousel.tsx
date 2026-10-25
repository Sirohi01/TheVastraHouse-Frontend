"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { MediaReference } from "@/lib/catalog";

/**
 * Cross-fading product photos. Only the first photo is rendered up front; each later one is
 * mounted just before it is shown (and then kept, so fades stay smooth), and the rotation only
 * runs while the card is on screen. Previously every photo of every card (twice, for the marquee
 * clone) was in the DOM and fetched on load.
 */
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
  // Highest index mounted so far: 0 on the server, the upcoming photo once rotation starts.
  const [mountedUpTo, setMountedUpTo] = useState(0);
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleMedia = media.filter((item) => item.type === "image" && item.url);
  const count = visibleMedia.length;

  useEffect(() => {
    setActiveIndex(0);
    setMountedUpTo(0);
  }, [count]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || count < 2) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, [count]);

  useEffect(() => {
    if (count < 2 || !inView) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % count);
    }, 2800);

    return () => window.clearInterval(timer);
  }, [count, inView]);

  // Keep the upcoming photo mounted (loading) one step ahead of the visible one.
  useEffect(() => {
    if (count < 2 || !inView) return;
    setMountedUpTo((mounted) => Math.min(count - 1, Math.max(mounted, activeIndex + 1)));
  }, [activeIndex, count, inView]);

  if (!count) {
    return (
      <div className="grid aspect-[9/16] place-items-center bg-muted px-3 text-center text-sm font-semibold text-muted-foreground">
        {alt}
      </div>
    );
  }

  return (
    <div className="relative aspect-[9/16] overflow-hidden" ref={containerRef}>
      {visibleMedia.map((item, index) =>
        index <= mountedUpTo ? (
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
        ) : null,
      )}
      {count > 1 ? (
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
