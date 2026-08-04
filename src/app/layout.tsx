import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { RootChrome } from "@/components/layout/RootChrome";
import { AppProviders } from "@/components/providers/AppProviders";
import { defaultCmsContent, fetchCmsContent } from "@/lib/cms";
import { buildOrganizationJsonLd, buildWebsiteJsonLd, getSeoSettings, getSiteUrl } from "@/lib/seo";
import "./globals.css";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: { default: seo.defaultTitle, template: `%s — ${seo.siteName}` },
    description: seo.defaultDescription,
    openGraph: {
      type: "website",
      url: siteUrl,
      siteName: seo.siteName,
      title: seo.defaultTitle,
      description: seo.defaultDescription,
      ...(seo.defaultOgImage
        ? { images: [{ url: seo.defaultOgImage, width: 1200, height: 630 }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: seo.defaultTitle,
      description: seo.defaultDescription,
      ...(seo.twitterHandle ? { site: seo.twitterHandle } : {}),
      ...(seo.defaultOgImage ? { images: [seo.defaultOgImage] } : {}),
    },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [cms, seo] = await Promise.all([loadCms(), getSeoSettings()]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <JsonLd data={buildOrganizationJsonLd(seo)} />
        <JsonLd data={buildWebsiteJsonLd(seo)} />
        <AppProviders>
          <RootChrome cms={cms}>{children}</RootChrome>
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
