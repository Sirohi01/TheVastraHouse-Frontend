"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";

const Lottie = dynamic(() => import("lottie-react").then((module) => module.LottieSvg), {
  ssr: false,
});

export function TrustLottieIcon({ fallback, src }: Readonly<{ fallback: ReactNode; src: string }>) {
  const [data, setData] = useState<object | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
  }, [src]);

  if (!data) {
    return <>{fallback}</>;
  }

  return <Lottie aria-hidden="true" autoplay className="size-14" loop src={data} />;
}
