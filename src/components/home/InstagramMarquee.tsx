"use client";

import { useEffect, useRef, useState } from "react";
import { CONSENT_EVENT, readConsent } from "@/lib/analytics";

declare global {
  interface Window {
    instgrm?: {
      Embeds?: {
        process: () => void;
      };
    };
  }
}

const INSTAGRAM_EMBED_SCRIPT_ID = "instagram-embed-script";

export function InstagramMarquee({ posts }: Readonly<{ posts: string[] }>) {
  const cleanPosts = posts.filter(Boolean);
  const marqueePosts = [...cleanPosts, ...cleanPosts];
  const containerRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [optedIn, setOptedIn] = useState(false);
  const embedsEnabled = nearViewport && optedIn;

  useEffect(() => {
    const syncConsent = () => setOptedIn((current) => current || readConsent().marketing);
    syncConsent();
    window.addEventListener(CONSENT_EVENT, syncConsent);
    return () => window.removeEventListener(CONSENT_EVENT, syncConsent);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!cleanPosts.length || !embedsEnabled) {
      return;
    }

    const processEmbeds = () => window.instgrm?.Embeds?.process();
    const existingScript = document.getElementById(INSTAGRAM_EMBED_SCRIPT_ID);

    if (existingScript) {
      processEmbeds();
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.id = INSTAGRAM_EMBED_SCRIPT_ID;
    script.src = "https://www.instagram.com/embed.js";
    script.onload = processEmbeds;
    document.body.appendChild(script);
  }, [cleanPosts.length, embedsEnabled]);

  if (!cleanPosts.length) {
    return null;
  }

  if (!embedsEnabled) {
    return (
      <div className="mt-5 text-center" ref={containerRef}>
        <p className="text-sm text-[#6f6256]">
          Instagram posts are loaded from Instagram, which may set cookies.
        </p>
        <button
          className="mt-3 h-10 rounded-md border border-[#caa14e] bg-[#6e1423] px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white"
          onClick={() => setOptedIn(true)}
          type="button"
        >
          Show Instagram posts
        </button>
        <ul className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
          {cleanPosts.slice(0, 6).map((href, index) => (
            <li key={href}>
              <a
                className="font-semibold text-[#6e1423] underline"
                href={href}
                rel="noreferrer noopener"
                target="_blank"
              >
                View post {index + 1} on Instagram
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-5 overflow-hidden" ref={containerRef}>
      <div className="instagram-marquee flex w-max animate-[instaMarquee_38s_linear_infinite] items-stretch gap-4 hover:[animation-play-state:paused]">
        {marqueePosts.map((href, index) => (
          <div
            className="h-[590px] w-[calc(100vw-40px)] max-w-[340px] shrink-0 overflow-hidden rounded-sm border border-[#e1d6c4] bg-white shadow-sm sm:h-[620px] sm:w-[340px]"
            key={`${href}-${index}`}
          >
            <blockquote
              className="instagram-media"
              data-instgrm-captioned
              data-instgrm-permalink={href}
              data-instgrm-version="14"
              style={{
                background: "#fff",
                border: 0,
                margin: 0,
                maxWidth: "100%",
                minWidth: "100%",
                padding: 0,
                width: "100%",
              }}
            >
              <a href={href} rel="noreferrer" target="_blank">
                View this post on Instagram
              </a>
            </blockquote>
          </div>
        ))}
      </div>
      <style jsx global>{`
        .instagram-marquee .instagram-media,
        .instagram-marquee iframe {
          height: 100% !important;
          min-height: 100% !important;
          max-height: 100% !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
      `}</style>
    </div>
  );
}
