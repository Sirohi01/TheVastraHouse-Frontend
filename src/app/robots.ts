import type { MetadataRoute } from "next";
import { getSeoSettings, getSiteUrl } from "@/lib/seo";

export const revalidate = 300;

/**
 * Private, transactional and utility routes are kept out of the index. Static assets
 * (/_next, images) are never blocked so crawlers can render pages.
 */
const privatePaths = [
  "/admin",
  "/account",
  "/api/",
  "/cart",
  "/checkout",
  "/wishlist",
  "/compare",
  "/payments",
  "/documents",
  "/returns",
  "/track-order",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/sign-in-code",
  "/unsubscribe",
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = getSiteUrl();
  const seo = await getSeoSettings();

  if (!seo.robots.indexSite) {
    return { rules: { disallow: "/", userAgent: "*" } };
  }

  return {
    host: siteUrl,
    rules: {
      allow: "/",
      // Internal search results are blocked; filter/sort variants stay crawlable so crawlers
      // can read their noindex + canonical tags (see buildPageMetadata).
      disallow: [...privatePaths, "/*?q=", "/*&q=", ...seo.robots.extraDisallow],
      userAgent: "*",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
