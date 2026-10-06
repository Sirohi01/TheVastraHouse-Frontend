import type { Metadata } from "next";
import { apiBaseUrl } from "@/lib/api";
import type { CatalogProduct, MediaReference, ProductVariant } from "@/lib/catalog";

/**
 * Single source of truth for storefront SEO. Every public page builds its metadata through
 * `buildPageMetadata`, which applies one fallback hierarchy:
 *   title:        entity SEO title → entity name (+ global title template) → global default
 *   description:  entity SEO description → entity text → global default
 *   image:        entity OG image → entity featured image → global default OG image
 *   robots:       noindex when the entity or the whole site is noindex (or page is private)
 * Metadata is produced server-side (generateMetadata), so it is present in the initial HTML.
 */

export type EntitySeo = {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: MediaReference;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: MediaReference;
  schemaEnabled?: boolean;
};

export type SeoSettings = {
  siteName: string;
  brandName: string;
  titleTemplate: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords: string[];
  baseUrl: string;
  defaultOgImage: string;
  defaultOgImageAlt: string;
  defaultTwitterImage: string;
  twitterHandle: string;
  facebookAppId: string;
  locale: string;
  verification: {
    google: string;
    bing: string;
    pinterest: string;
    yandex: string;
    other: Array<{ name: string; content: string }>;
  };
  robots: { indexSite: boolean; extraDisallow: string[] };
  organization: {
    legalName: string;
    logo: string;
    email: string;
    phone: string;
    streetAddress: string;
    locality: string;
    region: string;
    postalCode: string;
    countryCode: string;
    sameAs: string[];
  };
  pages: Array<{ path: string; label?: string; seo: EntitySeo }>;
  analytics?: { ga4MeasurementId?: string };
  /** Shipping/returns facts enforced by checkout; absent when the API predates them. */
  commerce?: {
    currency: string;
    freeShippingThreshold: number;
    returnWindowDays: number;
    shippingStandardFee: number;
  };
};

const FALLBACK_SETTINGS: SeoSettings = {
  analytics: {},
  baseUrl: "",
  brandName: "The Vastra House",
  defaultDescription:
    "Shop soft-luxury Indian wear at The Vastra House — festive kurtas, sarees and occasion wear crafted with heritage fabrics.",
  defaultKeywords: [],
  defaultOgImage: "",
  defaultOgImageAlt: "The Vastra House",
  defaultTitle: "The Vastra House — Soft-Luxury Indian Wear",
  defaultTwitterImage: "",
  facebookAppId: "",
  locale: "en_IN",
  organization: {
    countryCode: "IN",
    email: "",
    legalName: "The Vastra House",
    locality: "",
    logo: "",
    phone: "",
    postalCode: "",
    region: "",
    sameAs: [],
    streetAddress: "",
  },
  pages: [],
  robots: { extraDisallow: [], indexSite: true },
  siteName: "The Vastra House",
  titleTemplate: "%s | The Vastra House",
  twitterHandle: "",
  verification: { bing: "", google: "", other: [], pinterest: "", yandex: "" },
};

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${getSiteUrl()}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

export async function getSeoSettings(): Promise<SeoSettings> {
  try {
    const response = await fetch(`${apiBaseUrl}/catalog/seo-settings`, {
      next: { revalidate: 120, tags: ["seo:settings"] },
    });

    if (!response.ok) return FALLBACK_SETTINGS;

    const payload = (await response.json()) as { seo: Partial<SeoSettings> };
    return mergeSettings(payload.seo);
  } catch {
    return FALLBACK_SETTINGS;
  }
}

function mergeSettings(partial: Partial<SeoSettings>): SeoSettings {
  return {
    ...FALLBACK_SETTINGS,
    ...partial,
    organization: { ...FALLBACK_SETTINGS.organization, ...(partial.organization ?? {}) },
    robots: { ...FALLBACK_SETTINGS.robots, ...(partial.robots ?? {}) },
    verification: { ...FALLBACK_SETTINGS.verification, ...(partial.verification ?? {}) },
  };
}

export function clampText(value: string | undefined, max: number) {
  if (!value) return undefined;
  const text = value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text || undefined;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20))}…`;
}

export type PageMetadataInput = {
  /** Site path of the page, e.g. "/shop/red-kurta". Used for canonical and og:url. */
  path: string;
  /** Visible name of the entity (used with the title template when no SEO title is set). */
  name?: string;
  /** Plain description fallback (entity description/excerpt). */
  description?: string;
  seo?: EntitySeo;
  image?: MediaReference | { url: string; altText?: string };
  type?: "website" | "article";
  noindex?: boolean;
  /** Query-string variants (filters/sorts) should canonicalise to `path` and not be indexed. */
  isVariantUrl?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  /** When true the title is used as-is (home page). */
  absoluteTitle?: boolean;
};

/** Page-level SEO override set in Admin > SEO > Pages (for static routes like /about). */
export function pageOverride(settings: SeoSettings, path: string): EntitySeo | undefined {
  return settings.pages.find((page) => page.path === path)?.seo;
}

export function buildPageMetadata(settings: SeoSettings, input: PageMetadataInput): Metadata {
  const seo = { ...(pageOverride(settings, input.path) ?? {}), ...(input.seo ?? {}) };
  const customTitle = seo.title?.trim();
  const baseTitle = customTitle || input.name?.trim() || settings.defaultTitle;
  const description =
    clampText(seo.description, 320) ??
    clampText(input.description, 160) ??
    settings.defaultDescription;
  const canonical = resolveCanonical(seo.canonicalUrl, input.path);
  const imageUrl = socialImageUrl(seo.ogImage?.url || input.image?.url || settings.defaultOgImage);
  const imageAlt =
    seo.ogImage?.altText || input.image?.altText || input.name || settings.defaultOgImageAlt;
  const twitterImage =
    socialImageUrl(seo.twitterImage?.url) || imageUrl || settings.defaultTwitterImage;
  const index =
    settings.robots.indexSite && seo.robotsIndex !== false && !input.noindex && !input.isVariantUrl;
  const follow = seo.robotsFollow !== false;
  // Custom SEO titles and the home page are complete titles; entity names get the template.
  const title = customTitle || input.absoluteTitle ? { absolute: baseTitle } : baseTitle;
  const socialTitle =
    customTitle || (input.absoluteTitle ? baseTitle : `${baseTitle} | ${settings.siteName}`);

  return {
    alternates: { canonical },
    description,
    keywords: seo.keywords?.length ? seo.keywords : undefined,
    openGraph: {
      description: clampText(seo.ogDescription, 300) ?? description,
      images: imageUrl ? [{ alt: imageAlt, height: 630, url: imageUrl, width: 1200 }] : undefined,
      locale: settings.locale,
      siteName: settings.siteName,
      title: seo.ogTitle || socialTitle,
      type: input.type ?? "website",
      url: canonical,
      ...(input.type === "article"
        ? { modifiedTime: input.modifiedTime, publishedTime: input.publishedTime }
        : {}),
    },
    robots: {
      follow,
      googleBot: { follow, index, "max-image-preview": "large", "max-snippet": -1 },
      index,
    },
    title,
    twitter: {
      card: "summary_large_image",
      description: clampText(seo.twitterDescription, 200) ?? description,
      images: twitterImage ? [{ alt: imageAlt, url: twitterImage }] : undefined,
      site: settings.twitterHandle ? `@${settings.twitterHandle.replace(/^@/, "")}` : undefined,
      title: seo.twitterTitle || seo.ogTitle || socialTitle,
    },
  };
}

/** Private/utility pages (account, cart, checkout, auth): never indexed, links not followed. */
export const privatePageMetadata: Metadata = {
  robots: { follow: false, googleBot: { follow: false, index: false }, index: false },
};

/** Storefront routes a same-site canonical may point at (see app/ for the route tree). */
const CANONICAL_ROUTE_PREFIXES = [
  "/shop",
  "/pre-order",
  "/about",
  "/contact",
  "/faq",
  "/blog",
  "/categories/",
  "/collections/",
  "/pages/",
  "/policies",
];

function isStorefrontRoute(path: string) {
  const pathname = path.split(/[?#]/)[0] || "/";
  return (
    pathname === "/" ||
    CANONICAL_ROUTE_PREFIXES.some((prefix) =>
      prefix.endsWith("/")
        ? pathname.startsWith(prefix) && pathname.length > prefix.length
        : pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}

function resolveCanonical(custom: string | undefined, path: string) {
  const value = custom?.trim();
  if (!value) return absoluteUrl(path);

  const url = absoluteUrl(value);
  const siteUrl = getSiteUrl();
  // A same-site canonical that is not a real route (e.g. a typo like /products/x) would tell
  // crawlers to index a 404 instead of this page, so fall back to the page's own URL.
  if (url === siteUrl || url.startsWith(`${siteUrl}/`)) {
    if (!isStorefrontRoute(url.slice(siteUrl.length) || "/")) return absoluteUrl(path);
  }
  return url;
}

/**
 * Social cards are declared as 1200x630. Untransformed Cloudinary uploads (product photos are
 * usually portrait) are padded to exactly that size so the whole garment stays visible.
 */
function socialImageUrl(url: string | undefined) {
  if (!url) return url;
  return url.replace(
    /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/)/,
    "$1c_pad,b_auto:predominant,w_1200,h_630,f_jpg/$2",
  );
}

/** True when the URL carries filter/sort/search parameters that should not be indexed. */
export function hasIndexBlockingParams(params: Record<string, string | string[] | undefined>) {
  return Object.entries(params).some(
    ([key, value]) =>
      key !== "page" &&
      value !== undefined &&
      value !== "" &&
      !(Array.isArray(value) && !value.length),
  );
}

// ---------------- JSON-LD ----------------

/**
 * Serialises JSON-LD safely for inline <script>: escapes <, >, &, U+2028 and U+2029 so
 * admin-controlled text can never close the script tag or inject markup.
 */
const LINE_SEPARATOR = new RegExp(String.fromCharCode(0x2028), "g");
const PARAGRAPH_SEPARATOR = new RegExp(String.fromCharCode(0x2029), "g");

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(LINE_SEPARATOR, "\\u2028")
    .replace(PARAGRAPH_SEPARATOR, "\\u2029");
}

export function buildOrganizationJsonLd(settings: SeoSettings) {
  const org = settings.organization;
  const address =
    org.streetAddress || org.locality
      ? {
          address: {
            "@type": "PostalAddress",
            addressCountry: org.countryCode || "IN",
            addressLocality: org.locality || undefined,
            addressRegion: org.region || undefined,
            postalCode: org.postalCode || undefined,
            streetAddress: org.streetAddress || undefined,
          },
        }
      : {};
  const contact =
    org.email || org.phone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            areaServed: "IN",
            availableLanguage: ["en", "hi"],
            contactType: "customer service",
            email: org.email || undefined,
            telephone: org.phone || undefined,
          },
        }
      : {};

  return {
    "@context": "https://schema.org",
    "@id": `${getSiteUrl()}/#organization`,
    // OnlineStore is the Organization subtype Google recommends for merchants.
    "@type": "OnlineStore",
    description: settings.defaultDescription,
    legalName: org.legalName || undefined,
    name: settings.brandName || settings.siteName,
    url: getSiteUrl(),
    ...(org.logo ? { image: org.logo, logo: org.logo } : {}),
    ...(org.email ? { email: org.email } : {}),
    ...(org.phone ? { telephone: org.phone } : {}),
    ...(settings.commerce
      ? { hasMerchantReturnPolicy: buildReturnPolicyJsonLd(settings.commerce) }
      : {}),
    ...(org.sameAs.length ? { sameAs: org.sameAs } : {}),
    ...address,
    ...contact,
  };
}

/**
 * WebSite schema. No SearchAction: storefront search results (?q=) are disallowed in robots.txt
 * and noindexed, so advertising them as a search target would contradict the crawl rules.
 */
export function buildWebsiteJsonLd(settings: SeoSettings) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@id": `${siteUrl}/#website`,
    "@type": "WebSite",
    inLanguage: "en-IN",
    name: settings.siteName,
    publisher: { "@id": `${siteUrl}/#organization` },
    url: siteUrl,
  };
}

export type Crumb = { name: string; path: string };

export function buildBreadcrumbJsonLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      item: absoluteUrl(item.path),
      name: item.name,
      position: index + 1,
    })),
  };
}

/**
 * Maps API availability to schema.org. Returns undefined when stock was never entered for the SKU
 * (the API sets inventoryTracked=false): "out of stock" would then be a guess, not a fact.
 */
function schemaAvailability(variant: ProductVariant) {
  const availability = variant.availability;
  if (!availability) return undefined;
  if (availability.status === "in_stock" || availability.status === "low_stock") {
    return "https://schema.org/InStock";
  }
  if (availability.status === "pre_order") return "https://schema.org/PreOrder";
  return availability.inventoryTracked === false ? undefined : "https://schema.org/OutOfStock";
}

/**
 * Product schema from real data only: price and availability per active variant (matching what
 * the page shows), and aggregateRating only when approved reviews exist.
 */
type CommerceFacts = NonNullable<SeoSettings["commerce"]>;

function buildReturnPolicyJsonLd(commerce: CommerceFacts) {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "IN",
    merchantReturnDays: commerce.returnWindowDays,
    merchantReturnLink: absoluteUrl("/policies/return-policy"),
    returnMethod: "https://schema.org/ReturnByMail",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  };
}

/** Standard shipping, as charged at checkout: free at or above the threshold. */
function buildShippingDetailsJsonLd(commerce: CommerceFacts, price: number) {
  return {
    "@type": "OfferShippingDetails",
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
    shippingRate: {
      "@type": "MonetaryAmount",
      currency: commerce.currency,
      value: price >= commerce.freeShippingThreshold ? 0 : commerce.shippingStandardFee,
    },
  };
}

export function buildProductJsonLd(
  product: CatalogProduct,
  rating?: { average: number; count: number },
  brandName = "The Vastra House",
  commerce?: SeoSettings["commerce"],
) {
  const siteUrl = getSiteUrl();
  const url = absoluteUrl(`/shop/${product.slug}`);
  const variants = product.variants.filter((variant) => variant.active !== false);
  const media = product.media?.length ? product.media : (variants[0]?.media ?? []);
  const images = media.filter((item) => item.type === "image").map((item) => item.url);
  const category = product.categoryIds?.[0]?.name;
  const description = clampText(product.shortDescription ?? product.description, 5000);
  const brand = { "@type": "Brand", name: brandName };

  const variantNodes = variants.map((variant) => {
    const price = Number((variant.salePrice ?? variant.basePrice).toFixed(2));
    const variantImages = (variant.media ?? [])
      .filter((item) => item.type === "image")
      .map((item) => item.url);
    const availability = schemaAvailability(variant);
    const label = [variant.color, variant.size].filter(Boolean).join(" / ");

    return {
      "@id": `${url}#variant-${encodeURIComponent(variant.sku ?? variant._id)}`,
      "@type": "Product",
      brand,
      ...(variant.color ? { color: variant.color } : {}),
      description,
      image: variantImages.length ? variantImages : images,
      name: label ? `${product.name} - ${label}` : product.name,
      offers: {
        "@type": "Offer",
        ...(availability ? { availability } : {}),
        itemCondition: "https://schema.org/NewCondition",
        price,
        priceCurrency: variant.currencyCode ?? "INR",
        seller: { "@id": `${siteUrl}/#organization` },
        url,
        ...(commerce
          ? {
              hasMerchantReturnPolicy: buildReturnPolicyJsonLd(commerce),
              shippingDetails: buildShippingDetailsJsonLd(commerce, price),
            }
          : {}),
      },
      ...(variant.size ? { size: variant.size } : {}),
      ...(variant.sku ? { sku: variant.sku } : {}),
    };
  });

  const varies = [
    new Set(variants.map((variant) => variant.color).filter(Boolean)).size > 1 ? "color" : null,
    new Set(variants.map((variant) => variant.size).filter(Boolean)).size > 1 ? "size" : null,
  ].filter((item): item is string => item !== null);

  const reviewNode =
    rating && rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            bestRating: 5,
            ratingValue: rating.average,
            reviewCount: rating.count,
            worstRating: 1,
          },
        }
      : {};

  return {
    "@context": "https://schema.org",
    "@id": `${url}#product`,
    "@type": "ProductGroup",
    brand,
    ...(category ? { category } : {}),
    description,
    hasVariant: variantNodes,
    image: images,
    ...(product.fabricDetails ? { material: product.fabricDetails } : {}),
    name: product.name,
    productGroupID: product.slug,
    url,
    ...(varies.length ? { variesBy: varies.map((name) => `https://schema.org/${name}`) } : {}),
    ...reviewNode,
  };
}

export function buildArticleJsonLd(input: {
  path: string;
  headline: string;
  description?: string;
  image?: string;
  authorName?: string;
  datePublished?: string;
  dateModified?: string;
  publisherName: string;
  publisherLogo?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    author: input.authorName
      ? { "@type": "Person", name: input.authorName }
      : { "@id": `${getSiteUrl()}/#organization` },
    dateModified: input.dateModified ?? input.datePublished,
    datePublished: input.datePublished,
    description: input.description,
    headline: input.headline.slice(0, 110),
    image: input.image ? [input.image] : undefined,
    mainEntityOfPage: { "@id": absoluteUrl(input.path), "@type": "WebPage" },
    publisher: {
      "@type": "Organization",
      name: input.publisherName,
      ...(input.publisherLogo
        ? { logo: { "@type": "ImageObject", url: input.publisherLogo } }
        : {}),
    },
    url: absoluteUrl(input.path),
  };
}

/** FAQPage only for FAQs that are visibly rendered on the same page. */
export function buildFaqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      acceptedAnswer: { "@type": "Answer", text: clampText(faq.answer, 2000) },
      name: faq.question,
    })),
  };
}

export function buildCollectionPageJsonLd(input: {
  path: string;
  name: string;
  description?: string;
  products: Array<{ slug: string; name: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    description: clampText(input.description, 300),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: input.products.slice(0, 30).map((product, index) => ({
        "@type": "ListItem",
        name: product.name,
        position: index + 1,
        url: absoluteUrl(`/shop/${product.slug}`),
      })),
      numberOfItems: input.products.length,
    },
    name: input.name,
    url: absoluteUrl(input.path),
  };
}

export function buildWebPageJsonLd(input: {
  path: string;
  name: string;
  description?: string;
  type?: "WebPage" | "AboutPage" | "ContactPage";
  dateModified?: string;
  /** Marks the brand Organization as the subject of the page (About page). */
  aboutOrganization?: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": input.type ?? "WebPage",
    dateModified: input.dateModified,
    description: clampText(input.description, 300),
    isPartOf: { "@id": `${getSiteUrl()}/#website` },
    ...(input.aboutOrganization ? { about: { "@id": `${getSiteUrl()}/#organization` } } : {}),
    name: input.name,
    url: absoluteUrl(input.path),
  };
}

// ---------------- Sitemap data ----------------

export type SitemapData = {
  products: Array<{
    slug: string;
    updatedAt?: string;
    name?: string;
    images?: Array<{ url: string; alt?: string }>;
  }>;
  categories: Array<{ slug: string; name?: string; updatedAt?: string }>;
  collections: Array<{ slug: string; name?: string; updatedAt?: string }>;
};

export async function getSitemapData(): Promise<SitemapData> {
  try {
    const response = await fetch(`${apiBaseUrl}/catalog/sitemap`, { next: { revalidate: 300 } });
    if (!response.ok) return { categories: [], collections: [], products: [] };
    return (await response.json()) as SitemapData;
  } catch {
    return { categories: [], collections: [], products: [] };
  }
}
