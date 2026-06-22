"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import type { CmsHeroSlide } from "@/lib/cms";

const HERO_ASPECT_RATIO = "16 / 7";
const SLIDE_DURATION_MS = 6000;

export function HomeHero({ slides }: Readonly<{ slides: CmsHeroSlide[] }>) {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    setActiveSlide(0);
    if (slides.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, SLIDE_DURATION_MS);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const slide = slides[activeSlide] ?? slides[0];

  return (
    <section className="relative border-b border-[#e1d6c4]">
      <div className="relative overflow-hidden" style={{ aspectRatio: HERO_ASPECT_RATIO }}>
        {slides.map((item, index) => (
          <div
            aria-hidden={index !== activeSlide}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === activeSlide ? "opacity-100" : "opacity-0"
            }`}
            key={`${item.title}-${index}`}
          >
            {item.media?.type === "video" ? (
              <video
                aria-label={item.media.altText ?? item.title ?? "The Vastra House hero video"}
                autoPlay
                className="size-full object-cover"
                loop
                muted
                playsInline
                src={item.media.url}
              />
            ) : (
              <ResponsiveImage
                alt={item.media?.altText ?? "The Vastra House heritage inspired fashion hero banner"}
                aspectRatio={HERO_ASPECT_RATIO}
                priority={index === 0}
                quality={95}
                sizes="100vw"
                src={item.media?.url ?? "/images/home-hero.jpg"}
                unoptimized
              />
            )}
          </div>
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(46_12_18/0.58),rgb(46_12_18/0.28)_48%,rgb(46_12_18/0.04))]" />
        {slide.showOutline !== false ? (
          <div className="pointer-events-none absolute inset-3 border border-[#caa14e]/45 sm:inset-5 md:inset-6">
            <div className="absolute inset-[3px] border border-[#caa14e]/20" />
          </div>
        ) : null}

        <div className="absolute inset-0 hidden items-center md:flex">
          <div className={`mx-auto flex w-full max-w-7xl px-6 sm:px-12 ${positionClass(slide.contentPosition)}`}>
            <div
              className={`w-full max-w-xl text-white transition-opacity duration-300 ${
                slide.fontFamily === "sans" ? "" : "font-serif"
              }`}
              key={`${activeSlide}-${slide.title}`}
              style={{ color: slide.textColor ?? "#ffffff" }}
            >
              <span className="inline-flex items-center gap-2 border border-[#caa14e]/70 bg-[#2e0c12]/40 px-2 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-[#f0d9a4] backdrop-blur-sm sm:px-3 sm:text-[11px] sm:tracking-[0.26em]">
                {slide.eyebrow ?? "New Season Edit"}
              </span>
              <h1 className={`mt-3 font-semibold leading-[1.06] drop-shadow-sm sm:mt-5 ${titleSize(slide.fontSize)}`}>
                {slide.title ?? "Timeless Style, Rooted in Heritage"}
              </h1>
              <p className={`mt-2 max-w-md font-sans leading-5 text-current opacity-90 sm:mt-4 sm:leading-7 ${copySize(slide.copyFontSize)}`}>
                {slide.copy ?? "Premium tops, suits and clothing crafted for the modern you."}
              </p>
              {slide.primaryCta?.href ? (
                <a
                  className="group relative mt-3 inline-flex h-9 items-center gap-2 border border-[#caa14e] bg-[#6e1423] px-4 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#84182c] sm:mt-7 sm:h-12 sm:px-7 sm:text-sm sm:tracking-[0.12em]"
                  href={slide.primaryCta.href}
                >
                  {slide.primaryCta.label}
                  <ArrowRight aria-hidden="true" size={14} />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function titleSize(size: CmsHeroSlide["fontSize"]) {
  if (size === "sm") return "text-xl sm:text-4xl";
  if (size === "md") return "text-2xl sm:text-5xl";
  return "text-2xl sm:text-5xl lg:text-6xl";
}

function copySize(size: CmsHeroSlide["copyFontSize"]) {
  if (size === "sm") return "text-[11px] sm:text-sm";
  if (size === "lg") return "text-sm sm:text-lg";
  return "text-xs sm:text-base";
}

function positionClass(position: CmsHeroSlide["contentPosition"]) {
  if (position === "center") return "justify-center text-left";
  if (position === "right") return "justify-end text-left";
  return "justify-start text-left";
}
