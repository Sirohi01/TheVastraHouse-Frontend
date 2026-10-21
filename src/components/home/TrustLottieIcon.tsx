"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";

const Lottie = dynamic(() => import("lottie-react").then((module) => module.LottieSvg), {
  ssr: false,
});
export function TrustLottieIcon({
  className = "size-14",
  fallback,
  src,
}: Readonly<{ className?: string; fallback: ReactNode; src: string }>) {
  const [data, setData] = useState<object | null>(null);
  const [visible, setVisible] = useState(false);
  const sentinel = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const node = sentinel.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let active = true;
    fetch(src)
      .then((response) => (response.ok ? response.json() : null))
      .then((json) => {
        if (active && json) {
          setData(json);
        }
      })
      .catch(() => {
        // Keep the static icon if the animation cannot load.
      });

    return () => {
      active = false;
    };
  }, [src, visible]);

  return (
    <>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0" ref={sentinel} />
      {data ? (
        <Lottie aria-hidden="true" autoplay className={className} loop src={data} />
      ) : (
        fallback
      )}
    </>
  );
}
