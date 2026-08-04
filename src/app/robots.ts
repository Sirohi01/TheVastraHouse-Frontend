import type { MetadataRoute } from "next";
import { getSeoSettings, getSiteUrl } from "@/lib/seo";

export const revalidate = 300;

const builtInDisallow = ["/admin", "/account", "/cart", "/checkout", "/wishlist", "/payments"];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = getSiteUrl();
  const seo = await getSeoSettings();
  const extraDisallow = seo.robotsExtraDisallow
    .split(",")
    .map((path) => path.trim())
    .filter(Boolean);

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...builtInDisallow, ...extraDisallow],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
