import { ArrowRight, Award, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { HeroMedia, heroOverlayClass } from "@/components/media/HeroMedia";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { JsonLd } from "@/components/seo/JsonLd";
import { defaultCmsContent, fetchCmsContent, type CmsContent } from "@/lib/cms";
import { buildPageMetadata, buildWebPageJsonLd, getSeoSettings } from "@/lib/seo";

// Matches the public data window; admin edits refresh sooner via /api/revalidate.
export const revalidate = 300;

const iconMap: Record<string, LucideIcon> = {
  award: Award,
  care: HeartHandshake,
  shield: ShieldCheck,
  sparkles: Sparkles,
};

export async function generateMetadata(): Promise<Metadata> {
  const [settings, content] = await Promise.all([getSeoSettings(), loadAboutContent()]);
  const about = content.about ?? defaultCmsContent.about;
  return buildPageMetadata(settings, {
    description:
      about?.description ??
      "The Vastra House is an Indian ethnic wear brand for women, offering kurtis and co-ord sets.",
    image: about?.media ?? undefined,
    name: "About The Vastra House",
    path: "/about",
  });
}

export default async function AboutPage() {
  const content = await loadAboutContent();
  const about = { ...defaultCmsContent.about, ...content.about };
  const cta = about.primaryCta ?? { enabled: true, href: "/shop", label: "Explore Shop" };
  const ctaVisible = cta.enabled !== false && Boolean(cta.href) && Boolean(cta.label);
  const title = about.title ?? "Crafted With Passion, Worn With Pride";
  const sections = about.sections ?? [];
  const values = about.values ?? [];
  const storyImage = about.storyMedia?.url ? about.storyMedia : null;

  return (
    <div className="bg-[#fbf7ef]">
      <Breadcrumbs items={[{ name: "About Us", path: "/about" }]} visible={false} />
      <JsonLd
        data={buildWebPageJsonLd({
          description: about.description,
          name: "About The Vastra House",
          path: "/about",
          type: "AboutPage",
          aboutOrganization: true,
        })}
      />

      {/* Hero: same proportion as the home hero (4:5 on phones, 16/4.4 from md up). */}
      <section className="relative border-b border-[#e1d6c4]">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#2e0c12] md:aspect-[16/4.4] md:min-h-[340px]">
          <HeroMedia
            desktop={about.media}
            eager
            fallbackAlt="The Vastra House about banner"
            mobile={about.mobileMedia}
            title={title}
          />
          <div className={`absolute inset-0 ${heroOverlayClass(about.overlay)}`} />

          {about.showOutline !== false ? (
            <div className="pointer-events-none absolute inset-3 hidden border border-[#caa14e]/45 md:block md:inset-4">
              <CornerFiligree className="absolute -left-px -top-px text-[#caa14e]/85" />
              <CornerFiligree className="absolute -right-px -top-px rotate-90 text-[#caa14e]/85" />
              <CornerFiligree className="absolute -bottom-px -right-px rotate-180 text-[#caa14e]/85" />
              <CornerFiligree className="absolute -bottom-px -left-px -rotate-90 text-[#caa14e]/85" />
            </div>
          ) : null}

          <div className="absolute inset-0 flex items-end md:items-center">
            <div className="mx-auto w-full max-w-7xl px-6 pb-9 md:px-16 md:pb-0">
              <div
                className={`max-w-[34rem] ${
                  about.contentPosition === "center"
                    ? "mx-auto"
                    : about.contentPosition === "right"
                      ? "ml-auto"
                      : ""
                }`}
                style={{
                  color: about.textColor || "#ffffff",
                  textShadow:
                    about.overlay && about.overlay !== "none"
                      ? undefined
                      : "0 0 3px rgba(0,0,0,0.55), 0 2px 20px rgba(0,0,0,0.65)",
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] md:text-xs">
                  {about.eyebrow ?? "Our Story"}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[#caa14e] md:mt-3">
                  <span className="h-px w-10 bg-[#caa14e]" />
                  <span aria-hidden="true">✦</span>
                  <span className="h-px w-6 bg-[#caa14e]/60" />
                </div>
                <h1 className="mt-2 font-serif text-[30px] font-semibold uppercase leading-tight md:mt-3 md:text-[38px] lg:text-[48px] xl:text-[54px]">
                  {title}
                </h1>
                {about.description ? (
                  <p className="mt-2 line-clamp-3 max-w-md text-[13px] font-medium leading-6 md:mt-3 md:text-base md:leading-7">
                    {about.description}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-5">
        {/* Story */}
        <section className="py-10 sm:py-14">
          <div
            className={`grid items-center gap-8 lg:gap-14 ${
              storyImage ? "lg:grid-cols-2" : "mx-auto max-w-3xl text-center"
            }`}
          >
            <div className="min-w-0">
              <p
                className={`flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9b6d35] ${
                  storyImage ? "" : "justify-center"
                }`}
              >
                <span aria-hidden="true" className="text-sm text-[#caa14e]">
                  ❖
                </span>
                {about.storyEyebrow ?? "The Vastra House"}
                {about.foundedYear ? (
                  <span className="rounded-sm border border-[#caa14e]/60 px-2 py-0.5 tracking-[0.14em] text-[#6e1423]">
                    Since {about.foundedYear}
                  </span>
                ) : null}
              </p>
              <h2 className="mt-4 break-words font-serif text-3xl uppercase leading-tight text-[#3d1620] sm:text-4xl">
                {about.storyTitle ?? "Clothing that feels rooted, refined, and ready."}
              </h2>
              <FiligreeDivider align={storyImage ? "start" : "center"} className="my-5" />
              <p className="whitespace-pre-line break-words text-[15px] leading-8 text-[#5c5046]">
                {about.storyCopy}
              </p>
              {ctaVisible ? (
                <a
                  className="group relative mt-7 inline-flex h-12 items-center gap-2 border border-[#caa14e] bg-[#6e1423] px-6 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors duration-200 hover:bg-[#84182c]"
                  href={cta.href}
                  style={{ color: "#ffffff" }}
                >
                  {cta.label}
                  <ArrowRight
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                    size={14}
                  />
                </a>
              ) : null}
            </div>

            {storyImage ? (
              <div className="relative min-w-0 overflow-hidden rounded-sm border border-[#e1d6c4] shadow-[0_24px_60px_-44px_rgba(46,12,18,0.6)]">
                <ResponsiveImage
                  alt={storyImage.altText ?? "The Vastra House story"}
                  aspectRatio="4 / 3"
                  objectFit="cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  src={storyImage.url}
                />
                <span className="pointer-events-none absolute inset-3 border border-[#caa14e]/45" />
              </div>
            ) : null}
          </div>
        </section>

        {/* Content sections */}
        {sections.length ? (
          <section aria-label="About The Vastra House" className="grid gap-5 md:grid-cols-2">
            {sections.map((section, index) => (
              <article
                className="relative rounded-sm border border-[#e5dac7] bg-[#fffaf1] p-6 sm:p-7"
                key={`${section.heading}-${index}`}
              >
                <span
                  aria-hidden="true"
                  className="font-serif text-3xl leading-none text-[#caa14e]/70"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-3 break-words font-serif text-2xl text-[#3d1620]">
                  {section.heading}
                </h2>
                <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-[#5c5046]">
                  {section.body}
                </p>
              </article>
            ))}
          </section>
        ) : null}

        {/* Founder */}
        {about.founder?.name ? (
          <section className="mt-8 rounded-sm border border-[#e5dac7] bg-[#fffaf1] px-6 py-8 text-center sm:px-12">
            <FiligreeDivider align="center" />
            {about.founder.bio ? (
              <p className="mx-auto mt-5 max-w-3xl whitespace-pre-line font-serif text-xl leading-9 text-[#3d1620] sm:text-2xl">
                “{about.founder.bio}”
              </p>
            ) : null}
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#9b6d35]">
              {about.founder.name}
              {about.founder.role ? ` · ${about.founder.role}` : ""}
            </p>
          </section>
        ) : null}

        {/* Values */}
        {values.length ? (
          <section className="mt-14">
            <div className="text-center">
              <FiligreeDivider align="center" />
              <h2 className="mt-3 font-serif text-3xl uppercase tracking-[0.06em] text-[#3d1620]">
                {about.valuesTitle || "What We Stand For"}
              </h2>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((item, index) => {
                const Icon = iconMap[item.icon ?? "sparkles"] ?? Sparkles;

                return (
                  <article
                    className="group relative min-w-0 rounded-sm border border-[#e5dac7] bg-[#fffaf1] p-6 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-[#caa14e] hover:shadow-[0_16px_34px_-22px_rgba(110,20,35,0.6)]"
                    key={`${item.title}-${index}`}
                  >
                    <span className="mx-auto grid size-14 place-items-center rounded-full border border-[#caa14e] bg-[#fdf6e8] shadow-[inset_0_0_0_3px_rgba(202,161,78,0.18)]">
                      <Icon aria-hidden="true" className="text-[#6e1423]" size={24} />
                    </span>
                    <h3 className="mt-4 break-words font-serif text-base font-semibold uppercase tracking-wide text-[#3d1620]">
                      {item.title}
                    </h3>
                    <p className="mt-2 break-words text-sm leading-6 text-[#6f6256]">{item.text}</p>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Closing band */}
        {ctaVisible ? (
          <section className="relative mt-14 overflow-hidden rounded-sm bg-[#2e0c12] px-6 py-12 text-center text-white sm:px-12">
            <span className="pointer-events-none absolute inset-3 border border-[#caa14e]/40" />
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#e6c67a]">
              {about.storyEyebrow ?? "The Vastra House"}
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl font-serif text-3xl uppercase leading-tight sm:text-4xl">
              {about.closingTitle || "Discover the collection"}
            </h2>
            {about.closingCopy ? (
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/80">
                {about.closingCopy}
              </p>
            ) : null}
            <a
              className="mt-7 inline-flex h-12 items-center gap-2 border border-[#caa14e] bg-white px-7 text-xs font-semibold uppercase tracking-[0.14em] text-[#5a3a1c] transition-colors hover:bg-[#f6ecda]"
              href={cta.href}
              style={{ color: "#5a3a1c" }}
            >
              {cta.label}
              <ArrowRight aria-hidden="true" size={14} />
            </a>
          </section>
        ) : null}
      </div>
    </div>
  );
}

async function loadAboutContent(): Promise<CmsContent> {
  try {
    const payload = await fetchCmsContent("storefront-main");
    return payload.content ?? defaultCmsContent;
  } catch {
    return defaultCmsContent;
  }
}

/* ---------- Royal ornamental helpers (presentational only) ---------- */

function FiligreeDivider({
  align = "center",
  className = "",
}: Readonly<{ align?: "center" | "start"; className?: string }>) {
  return (
    <div
      className={`flex items-center gap-2 text-[#caa14e] ${align === "center" ? "justify-center" : "justify-start"} ${className}`}
    >
      <span className="h-px w-10 bg-[linear-gradient(90deg,transparent,#caa14e)]" />
      <svg aria-hidden="true" height="14" viewBox="0 0 56 14" width="56">
        <path
          d="M2 7c8-6 14-6 18 0-4 6-10 6-18 0Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle cx="28" cy="7" fill="#6e1423" r="2.4" />
        <path
          d="M54 7c-8-6-14-6-18 0 4 6 10 6 18 0Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      <span className="h-px w-10 bg-[linear-gradient(90deg,#caa14e,transparent)]" />
    </div>
  );
}

function CornerFiligree({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="30"
      stroke="currentColor"
      strokeWidth="1"
      viewBox="0 0 34 34"
      width="30"
    >
      <path d="M1 12C1 6 6 1 12 1" />
      <path d="M1 20c6 0 11-5 11-11" />
      <circle cx="12" cy="12" fill="currentColor" r="1.6" stroke="none" />
    </svg>
  );
}
