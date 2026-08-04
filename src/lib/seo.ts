import { apiBaseUrl } from "@/lib/api";
import type { CatalogProduct, ProductReview } from "@/lib/catalog";

export type SitemapData = {
  products: Array<{ slug: string; updatedAt?: string }>;
  categories: Array<{ slug: string; updatedAt?: string }>;
  collections: Array<{ slug: string; updatedAt?: string }>;
};

export type SeoSettings = {
  siteName: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultOgImage: string;
  twitterHandle: string;
  organizationLogoUrl: string;
  robotsExtraDisallow: string;
};

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function getSitemapData(): Promise<SitemapData> {
  const response = await fetch(`${apiBaseUrl}/catalog/sitemap`, { cache: "no-store" });

  if (!response.ok) {
    return { products: [], categories: [], collections: [] };
  }

  return response.json() as Promise<SitemapData>;
}

export async function getSeoSettings(): Promise<SeoSettings> {
  const fallback: SeoSettings = {
    siteName: "The Vastra House",
    defaultTitle: "The Vastra House — Soft-Luxury Indian Wear",
    defaultDescription: "Soft-luxury Indian wear, festive edits, and everyday occasion pieces.",
    defaultOgImage: "",
    twitterHandle: "",
    organizationLogoUrl: "",
    robotsExtraDisallow: "",
  };

  try {
    const response = await fetch(`${apiBaseUrl}/catalog/seo-settings`, {
      next: { revalidate: 300, tags: ["seo:settings"] },
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = (await response.json()) as { seo: SeoSettings };
    return payload.seo;
  } catch {
    return fallback;
  }
}

export function buildOrganizationJsonLd(seo: SeoSettings) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seo.siteName,
    url: siteUrl,
    ...(seo.organizationLogoUrl ? { logo: seo.organizationLogoUrl } : {}),
    ...(seo.twitterHandle
      ? { sameAs: [`https://twitter.com/${seo.twitterHandle.replace(/^@/, "")}`] }
      : {}),
  };
}

export function buildWebsiteJsonLd(seo: SeoSettings) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: seo.siteName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/shop?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}

export function buildProductJsonLd(product: CatalogProduct, reviews: ProductReview[]) {
  const siteUrl = getSiteUrl();
  const variant = product.variants[0];
  const price = variant?.salePrice ?? variant?.basePrice ?? 0;
  const media = product.media?.length ? product.media : (variant?.media ?? []);
  const ratingCount = reviews.length;
  const averageRating = ratingCount
    ? reviews.reduce((total, review) => total + review.rating, 0) / ratingCount
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description,
    image: media.map((item) => item.url),
    sku: variant?.sku,
    url: `${siteUrl}/shop/${product.slug}`,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: variant?.currencyCode ?? "INR",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/shop/${product.slug}`,
    },
    ...(averageRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(averageRating.toFixed(1)),
            reviewCount: ratingCount,
          },
        }
      : {}),
  };
}
