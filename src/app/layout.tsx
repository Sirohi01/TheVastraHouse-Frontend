import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { Analytics } from "@/components/analytics/Analytics";
import { JsonLd } from "@/components/seo/JsonLd";
import { RootChrome } from "@/components/layout/RootChrome";
import { AppProviders } from "@/components/providers/AppProviders";
import { defaultCmsContent, fetchCmsContent } from "@/lib/cms";
import { fetchCmsPages } from "@/lib/content";
import { buildOrganizationJsonLd, buildWebsiteJsonLd, getSeoSettings, getSiteUrl } from "@/lib/seo";
import "./globals.css";

export const revalidate = 60;

// Storefront chrome (header + hero) display/body fonts. Exposed as CSS variables so
// the rest of the site keeps its existing typography.
const displayFont = Cormorant_Garamond({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
});
const bodyFont = Jost({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500"],
});

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: "#8b1e2d",
  width: "device-width",
};

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();
  const siteUrl = getSiteUrl();
  const other: Record<string, string> = {};

  if (seo.verification.bing) other["msvalidate.01"] = seo.verification.bing;
  if (seo.verification.pinterest) other["p:domain_verify"] = seo.verification.pinterest;
  for (const tag of seo.verification.other) other[tag.name] = tag.content;
  if (seo.facebookAppId) other["fb:app_id"] = seo.facebookAppId;

  return {
    applicationName: seo.siteName,
    description: seo.defaultDescription,
    keywords: seo.defaultKeywords.length ? seo.defaultKeywords : undefined,
    metadataBase: new URL(siteUrl),
    openGraph: {
      description: seo.defaultDescription,
      images: seo.defaultOgImage
        ? [{ alt: seo.defaultOgImageAlt, height: 630, url: seo.defaultOgImage, width: 1200 }]
        : undefined,
      locale: seo.locale,
      siteName: seo.siteName,
      title: seo.defaultTitle,
      // No og:url here: pages inheriting these defaults must not claim the home page URL.
      type: "website",
    },
    robots: seo.robots.indexSite
      ? { follow: true, index: true }
      : { follow: false, googleBot: { follow: false, index: false }, index: false },
    title: {
      default: seo.defaultTitle,
      template: seo.titleTemplate.includes("%s") ? seo.titleTemplate : `%s | ${seo.siteName}`,
    },
    twitter: {
      card: "summary_large_image",
      description: seo.defaultDescription,
      images: seo.defaultTwitterImage ? [seo.defaultTwitterImage] : undefined,
      site: seo.twitterHandle ? `@${seo.twitterHandle.replace(/^@/, "")}` : undefined,
      title: seo.defaultTitle,
    },
    verification: {
      google: seo.verification.google || undefined,
      other: Object.keys(other).length ? other : undefined,
      yandex: seo.verification.yandex || undefined,
    },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [cms, seo, policies] = await Promise.all([
    loadCms(),
    getSeoSettings(),
    fetchCmsPages("policy").catch(() => ({ pages: [] })),
  ]);
  const policyPages = policies.pages.map((page) => ({ slug: page.slug, title: page.title }));

  return (
    <html
      className={`${displayFont.variable} ${bodyFont.variable}`}
      lang="en-IN"
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <a
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
          href="#content"
        >
          Skip to content
        </a>
        <JsonLd data={buildOrganizationJsonLd(seo)} />
        <JsonLd data={buildWebsiteJsonLd(seo)} />
        <AppProviders>
          <RootChrome cms={cms} policyPages={policyPages}>
            {children}
          </RootChrome>
          <Analytics measurementId={seo.analytics?.ga4MeasurementId ?? ""} />
        </AppProviders>
      </body>
    </html>
  );
}

async function loadCms() {
  try {
    const payload = await fetchCmsContent("storefront-main");
    return payload.content ?? defaultCmsContent;
  } catch {
    return defaultCmsContent;
  }
}
