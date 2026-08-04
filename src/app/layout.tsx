import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { RootChrome } from "@/components/layout/RootChrome";
import { AppProviders } from "@/components/providers/AppProviders";
import { defaultCmsContent, fetchCmsContent } from "@/lib/cms";
import { buildOrganizationJsonLd, buildWebsiteJsonLd, getSeoSettings } from "@/lib/seo";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();

  return {
    title: { default: seo.defaultTitle, template: `%s — ${seo.siteName}` },
    description: seo.defaultDescription,
    openGraph: {
      siteName: seo.siteName,
      title: seo.defaultTitle,
      description: seo.defaultDescription,
      ...(seo.defaultOgImage ? { images: [{ url: seo.defaultOgImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      ...(seo.twitterHandle ? { site: seo.twitterHandle } : {}),
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
