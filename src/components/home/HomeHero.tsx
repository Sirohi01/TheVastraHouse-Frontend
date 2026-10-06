"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { MediaReference } from "@/lib/catalog";
import type { CmsHeroSlide } from "@/lib/cms";

const DEFAULT_SLIDE_SECONDS = 6;

export function HomeHero({
  slideDuration,
  slides,
}: Readonly<{ slideDuration?: number; slides: CmsHeroSlide[] }>) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [visited, setVisited] = useState<number[]>([0]);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const intervalMs = Math.min(Math.max(slideDuration ?? DEFAULT_SLIDE_SECONDS, 3), 30) * 1000;

  const goTo = useCallback(
    (index: number) => {
      const next = ((index % count) + count) % count;
      setActiveSlide(next);
      setVisited((current) => (current.includes(next) ? current : [...current, next]));
    },
    [count],
  );

  useEffect(() => {
    setActiveSlide(0);
    setVisited([0]);
  }, [count]);

  useEffect(() => {
    if (count < 2 || paused) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const timer = window.setTimeout(() => goTo(activeSlide + 1), intervalMs);
    return () => window.clearTimeout(timer);
  }, [activeSlide, count, goTo, intervalMs, paused]);

  if (!count) {
    return null;
  }

  return (
    <section
      aria-roledescription="carousel"
      className="relative border-b border-[#e1d6c4] font-[family-name:var(--font-body)]"
      onBlur={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#2e0c12] md:aspect-[16/4.4] md:min-h-[340px]">
        {slides.map((slide, index) => {
          const isActive = index === activeSlide;
          const shouldRender = visited.includes(index) || index === (activeSlide + 1) % count;

          return (
            <div
              aria-hidden={!isActive}
              aria-label={`Slide ${index + 1} of ${count}`}
              className={`absolute inset-0 transition-opacity duration-700 ${
                isActive ? "z-10 opacity-100" : "pointer-events-none opacity-0"
              }`}
              inert={!isActive}
              key={`${slide.title ?? "slide"}-${index}`}
              role="group"
            >
              {shouldRender ? <HeroSlide isFirst={index === 0} slide={slide} /> : null}
            </div>
          );
        })}

        {count > 1 ? (
          <>
            <button
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 z-20 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/40 md:inline-flex"
              onClick={() => goTo(activeSlide - 1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={18} />
            </button>
            <button
              aria-label="Next slide"
              className="absolute right-3 top-1/2 z-20 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/40 md:inline-flex"
              onClick={() => goTo(activeSlide + 1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={18} />
            </button>
            <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-2">
              {slides.map((slide, index) => (
                <button
                  aria-current={index === activeSlide}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeSlide ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                  key={`${slide.title ?? "dot"}-${index}`}
                  onClick={() => goTo(index)}
                  type="button"
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function HeroSlide({ isFirst, slide }: Readonly<{ isFirst: boolean; slide: CmsHeroSlide }>) {
  const desktopMedia = slide.media;
  const mobileMedia = slide.mobileMedia?.url ? slide.mobileMedia : slide.media;
  const textColor = slide.textColor ?? "#ffffff";
  const displayFont =
    slide.fontFamily === "sans"
      ? "font-[family-name:var(--font-body)]"
      : "font-[family-name:var(--font-display)]";
  const primary =
    slide.primaryCta?.enabled !== false && slide.primaryCta?.href ? slide.primaryCta : null;
  const secondary =
    slide.secondaryCta?.enabled !== false && slide.secondaryCta?.href && slide.secondaryCta.label
      ? slide.secondaryCta
      : null;
  const hasText = Boolean(slide.eyebrow || slide.title || slide.copy || primary || secondary);

  return (
    <>
      <MediaLayer desktop={desktopMedia} eager={isFirst} mobile={mobileMedia} title={slide.title} />
      <div className={`absolute inset-0 ${overlayClass(slide.overlay)}`} />
      {slide.showOutline === true ? (
        <div className="pointer-events-none absolute inset-3 border border-[#caa14e]/45 md:inset-4">
          <div className="absolute inset-[3px] border border-[#caa14e]/20" />
        </div>
      ) : null}

      {hasText ? (
        <div
          className={`absolute inset-0 items-end md:items-center ${
            slide.showTextOnMobile === false ? "hidden md:flex" : "flex"
          }`}
        >
          <div
            className={`mx-auto flex w-full max-w-7xl px-6 pb-9 md:px-16 md:pb-0 ${positionClass(slide.contentPosition)}`}
          >
            <div
              className={`w-full max-w-[34rem] ${slide.contentPosition === "center" ? "md:text-center" : ""}`}
              style={{ color: textColor }}
            >
              {slide.eyebrow ? (
                <p
                  className={`flex items-center gap-3 text-[10px] font-normal uppercase tracking-[0.3em] md:text-[12px] ${
                    slide.contentPosition === "center" ? "md:justify-center" : ""
                  }`}
                >
                  {slide.eyebrow}
                  <span className="hidden h-px w-14 bg-current opacity-80 md:inline-block" />
                </p>
              ) : null}
              {slide.title ? (
                <h1
                  className={`mt-2 font-medium uppercase leading-[1.05] tracking-[0.02em] md:mt-3 ${displayFont} ${titleSize(slide.fontSize)}`}
                >
                  {slide.title}
                </h1>
              ) : null}
              {slide.copy ? (
                <p
                  className={`mt-2 line-clamp-2 max-w-md whitespace-pre-line font-light leading-5 tracking-[0.04em] opacity-90 md:mt-3 md:line-clamp-3 md:leading-6 ${copySize(slide.copyFontSize)}`}
                >
                  {slide.copy}
                </p>
              ) : null}
              {primary || secondary ? (
                <div
                  className={`mt-4 flex flex-wrap gap-2 md:mt-5 md:gap-3 ${
                    slide.contentPosition === "center" ? "md:justify-center" : ""
                  }`}
                >
                  {primary ? (
                    <a
                      className="inline-flex h-9 items-center gap-2 bg-white px-4 text-[10px] font-normal uppercase tracking-[0.2em] transition hover:bg-[#f6ecda] md:h-10 md:px-6 md:text-[11px]"
                      href={primary.href}
                      style={{ color: "#5a3a1c" }}
                    >
                      {primary.label}
                      <ArrowRight aria-hidden="true" size={13} />
                    </a>
                  ) : null}
                  {secondary ? (
                    <a
                      className="inline-flex h-9 items-center border border-white/80 px-4 text-[10px] font-normal uppercase tracking-[0.2em] transition hover:bg-white/15 md:h-10 md:px-6 md:text-[11px]"
                      href={secondary.href}
                      style={{ color: "#ffffff" }}
                    >
                      {secondary.label}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Desktop media on md+, 4:5 mobile media below md (falls back to the desktop media). */
function MediaLayer({
  desktop,
  eager,
  mobile,
  title,
}: Readonly<{
  desktop?: MediaReference | null;
  eager: boolean;
  mobile?: MediaReference | null;
  title?: string;
}>) {
  const desktopMedia = desktop?.url ? desktop : null;
  const mobileMedia = mobile?.url ? mobile : null;
  const sameSource = desktopMedia?.url === mobileMedia?.url;

  if (!desktopMedia && !mobileMedia) {
    return (
      <Image
        alt="The Vastra House heritage inspired fashion hero banner"
        className="object-cover"
        fill
        priority={eager}
        sizes="100vw"
        src="/images/home-hero.jpg"
      />
    );
  }

  if (sameSource || !mobileMedia || !desktopMedia) {
    return <SingleMedia eager={eager} media={(desktopMedia ?? mobileMedia)!} title={title} />;
  }

  return (
    <>
      <div className="absolute inset-0 hidden md:block">
        <SingleMedia eager={eager} media={desktopMedia} title={title} />
      </div>
      <div className="absolute inset-0 md:hidden">
        <SingleMedia eager={eager} media={mobileMedia} title={title} />
      </div>
    </>
  );
}

function SingleMedia({
  eager,
  media,
  title,
}: Readonly<{ eager: boolean; media: MediaReference; title?: string }>) {
  const alt = media.altText ?? title ?? "The Vastra House hero banner";

  if (media.type === "video") {
    return (
      <video
        aria-label={alt}
        autoPlay
        className="size-full object-cover"
        loop
        muted
        playsInline
        preload={eager ? "auto" : "metadata"}
        src={media.url}
      />
    );
  }

  return (
    <Image
      alt={alt}
      className="object-cover"
      fetchPriority={eager ? "high" : "auto"}
      fill
      sizes="100vw"
      src={media.url}
    />
  );
}

function overlayClass(overlay: CmsHeroSlide["overlay"]) {
  if (overlay === "none") return "";
  if (overlay === "soft") {
    return "bg-[linear-gradient(0deg,rgb(30_8_12/0.45),transparent_55%)] md:bg-[linear-gradient(90deg,rgb(30_8_12/0.3),rgb(30_8_12/0.1)_55%,transparent)]";
  }
  if (overlay === "strong") {
    return "bg-[linear-gradient(0deg,rgb(30_8_12/0.85),rgb(30_8_12/0.3)_70%)] md:bg-[linear-gradient(90deg,rgb(30_8_12/0.75),rgb(30_8_12/0.4)_55%,rgb(30_8_12/0.1))]";
  }
  return "bg-[linear-gradient(0deg,rgb(30_8_12/0.7),rgb(30_8_12/0.15)_65%,transparent)] md:bg-[linear-gradient(90deg,rgb(30_8_12/0.55),rgb(30_8_12/0.25)_55%,transparent)]";
}

function titleSize(size: CmsHeroSlide["fontSize"]) {
  if (size === "sm") return "text-[22px] md:text-[28px] lg:text-[34px]";
  if (size === "md") return "text-[26px] md:text-[34px] lg:text-[42px]";
  return "text-[30px] md:text-[38px] lg:text-[48px] xl:text-[54px]";
}

function copySize(size: CmsHeroSlide["copyFontSize"]) {
  if (size === "sm") return "text-[11px] md:text-[13px]";
  if (size === "lg") return "text-[13px] md:text-[17px]";
  return "text-xs md:text-[15px]";
}

function positionClass(position: CmsHeroSlide["contentPosition"]) {
  if (position === "center") return "justify-center";
  if (position === "right") return "justify-end";
  return "justify-start";
}
