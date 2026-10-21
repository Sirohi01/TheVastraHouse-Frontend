import Image from "next/image";
import type { MediaReference } from "@/lib/catalog";

/** Desktop media on md+, 4:5 mobile media below md (falls back to the desktop media). */
export function HeroMedia({
  fallbackAlt = "The Vastra House heritage inspired fashion hero banner",
  fallbackSrc = "/images/home-hero.jpg",
  desktop,
  eager,
  mobile,
  title,
}: Readonly<{
  fallbackAlt?: string;
  fallbackSrc?: string;
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
        alt={fallbackAlt}
        className="object-cover"
        fill
        priority={eager}
        sizes="100vw"
        src={fallbackSrc}
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
      fill
      // priority = eager load + preload. fetchPriority alone left Next defaulting to
      // loading="lazy", which delayed the LCP image by seconds.
      priority={eager}
      sizes="100vw"
      src={media.url}
    />
  );
}

export type HeroOverlay = "none" | "soft" | "medium" | "strong";

/** Tint above a hero photo. "none" (default) leaves the photo exactly as uploaded. */
export function heroOverlayClass(overlay?: HeroOverlay | null) {
  if (overlay === "soft") {
    return "bg-[linear-gradient(0deg,rgb(30_8_12/0.35),transparent_55%)] md:bg-[linear-gradient(90deg,rgb(30_8_12/0.3),rgb(30_8_12/0.1)_55%,transparent)]";
  }
  if (overlay === "medium") {
    return "bg-[linear-gradient(0deg,rgb(30_8_12/0.7),rgb(30_8_12/0.15)_65%,transparent)] md:bg-[linear-gradient(90deg,rgb(30_8_12/0.55),rgb(30_8_12/0.25)_55%,transparent)]";
  }
  if (overlay === "strong") {
    return "bg-[linear-gradient(0deg,rgb(30_8_12/0.85),rgb(30_8_12/0.3)_70%)] md:bg-[linear-gradient(90deg,rgb(30_8_12/0.75),rgb(30_8_12/0.4)_55%,rgb(30_8_12/0.1))]";
  }
  return "hidden";
}
