import { apiBaseUrl } from "@/lib/api";
import { absoluteUrl, getSeoSettings, getSitemapData } from "@/lib/seo";

export const revalidate = 3600;

type PageList = { pages: Array<{ slug: string; title: string; kind?: "page" | "policy" }> };

/**
 * /llms.txt: a plain-text, curated map of the site for language-model crawlers and agents.
 * It is a convenience, not a ranking signal. Everything listed is public and generated from
 * live data, so it cannot drift from the real catalogue and policies.
 */
export async function GET() {
  const [settings, catalog, pages] = await Promise.all([
    getSeoSettings(),
    getSitemapData(),
    fetch(`${apiBaseUrl}/content/pages`, { next: { revalidate: 3600 } })
      .then((response) => (response.ok ? (response.json() as Promise<PageList>) : { pages: [] }))
      .catch(() => ({ pages: [] }) as PageList),
  ]);
  const org = settings.organization;
  const link = (title: string, path: string, note?: string) =>
    `- [${title}](${absoluteUrl(path)})${note ? `: ${note}` : ""}`;

  const policyPages = pages.pages.filter((page) => page.kind === "policy");
  const helpPages = pages.pages.filter((page) => page.kind !== "policy");
  const commerce = settings.commerce;

  const lines = [
    `# ${settings.brandName}`,
    "",
    `> ${settings.defaultDescription}`,
    "",
    `${settings.brandName} is an online store selling Indian ethnic wear for women, shipped within India. Prices are in ${commerce?.currency ?? "INR"}.`,
    ...(commerce
      ? [
          `Free standard shipping applies on orders of ${commerce.currency} ${commerce.freeShippingThreshold} or more; returns can be requested within ${commerce.returnWindowDays} days of delivery (see the return policy for conditions).`,
        ]
      : []),
    "",
    "## Shop",
    link("All products", "/shop", "full catalogue with prices, sizes and availability"),
    ...catalog.categories.map((item) =>
      link(`${item.name ?? item.slug} (category)`, `/categories/${item.slug}`),
    ),
    ...catalog.collections.map((item) =>
      link(`${item.name ?? item.slug} (collection)`, `/collections/${item.slug}`),
    ),
    "",
    "## Products",
    ...catalog.products.map((item) => link(item.name ?? item.slug, `/shop/${item.slug}`)),
    "",
    "## Help and policies",
    link("About", "/about"),
    link("Contact", "/contact"),
    link("Policies", "/policies"),
    ...policyPages.map((page) => link(page.title, `/policies/${page.slug}`)),
    ...helpPages.map((page) =>
      link(page.title, page.slug === "faq" ? "/faq" : `/pages/${page.slug}`),
    ),
    "",
    "## Contact",
    ...(org.email ? [`- Email: ${org.email}`] : []),
    ...(org.phone ? [`- Phone: ${org.phone}`] : []),
    ...(org.locality
      ? [`- Location: ${[org.locality, org.region].filter(Boolean).join(", ")}`]
      : []),
    ...org.sameAs.map((url) => `- Profile: ${url}`),
    "",
    "## Machine-readable",
    `- Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
