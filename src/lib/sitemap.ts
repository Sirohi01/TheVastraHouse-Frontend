import { apiBaseUrl } from "@/lib/api";
import { getSeoSettings, getSitemapData, getSiteUrl } from "@/lib/seo";

/**
 * XML sitemap generation. The index at /sitemap.xml points to typed child sitemaps so large
 * catalogues split cleanly (Google's limit is 50,000 URLs per file; we chunk at 5,000).
 */
export const SITEMAP_CHUNK = 5000;

type UrlEntry = {
  loc: string;
  lastmod?: string;
  changefreq?: "daily" | "weekly" | "monthly";
  priority?: number;
  images?: Array<{ url: string; title?: string }>;
};

const STATIC_PATHS: Array<{ path: string; priority: number; changefreq: UrlEntry["changefreq"] }> =
  [
    { changefreq: "daily", path: "", priority: 1 },
    { changefreq: "daily", path: "/shop", priority: 0.9 },
    { changefreq: "daily", path: "/pre-order", priority: 0.7 },
    { changefreq: "monthly", path: "/about", priority: 0.5 },
    { changefreq: "monthly", path: "/contact", priority: 0.5 },
    { changefreq: "monthly", path: "/faq", priority: 0.5 },
    { changefreq: "weekly", path: "/blog", priority: 0.6 },
    { changefreq: "monthly", path: "/policies", priority: 0.3 },
  ];

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isoDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function renderUrlset(entries: UrlEntry[]) {
  const body = entries
    .map((entry) => {
      const images = (entry.images ?? [])
        .map(
          (image) =>
            `<image:image><image:loc>${escapeXml(image.url)}</image:loc>${image.title ? `<image:title>${escapeXml(image.title)}</image:title>` : ""}</image:image>`,
        )
        .join("");
      return `<url><loc>${escapeXml(entry.loc)}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ""}${entry.priority !== undefined ? `<priority>${entry.priority.toFixed(1)}</priority>` : ""}${images}</url>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${body}</urlset>`;
}

export function renderIndex(locations: Array<{ loc: string; lastmod?: string }>) {
  const body = locations
    .map(
      (item) =>
        `<sitemap><loc>${escapeXml(item.loc)}</loc>${item.lastmod ? `<lastmod>${item.lastmod}</lastmod>` : ""}</sitemap>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}

type BlogSitemap = {
  posts: Array<{
    slug: string;
    updatedAt?: string;
    title?: string;
    featuredImage?: { url?: string };
  }>;
  categories: Array<{ slug: string; updatedAt?: string }>;
};

type PageSitemap = {
  pages: Array<{
    slug: string;
    kind?: "page" | "policy";
    updatedAt?: string;
    seo?: { robotsIndex?: boolean };
  }>;
};

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, { next: { revalidate: 300 } });
    return response.ok ? ((await response.json()) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function sitemapIndexLocations() {
  const siteUrl = getSiteUrl();
  const [data, blog] = await Promise.all([
    getSitemapData(),
    fetchJson<BlogSitemap>("/content/blog/sitemap", { categories: [], posts: [] }),
  ]);
  const productChunks = Math.max(1, Math.ceil(data.products.length / SITEMAP_CHUNK));
  const newest = (items: Array<{ updatedAt?: string }>) =>
    isoDate(
      items
        .map((item) => item.updatedAt)
        .filter(Boolean)
        .sort()
        .at(-1),
    );

  return [
    { loc: `${siteUrl}/sitemaps/pages.xml` },
    ...Array.from({ length: productChunks }, (_, index) => ({
      lastmod: newest(data.products.slice(index * SITEMAP_CHUNK, (index + 1) * SITEMAP_CHUNK)),
      loc: `${siteUrl}/sitemaps/products-${index + 1}.xml`,
    })),
    { lastmod: newest(data.categories), loc: `${siteUrl}/sitemaps/categories.xml` },
    { lastmod: newest(data.collections), loc: `${siteUrl}/sitemaps/collections.xml` },
    // An empty blog sitemap is omitted until the first article is published.
    ...(blog.posts.length
      ? [{ lastmod: newest(blog.posts), loc: `${siteUrl}/sitemaps/blog.xml` }]
      : []),
  ];
}

/** Returns XML for one child sitemap, or null for an unknown name. */
export async function renderChildSitemap(name: string) {
  const siteUrl = getSiteUrl();
  const settings = await getSeoSettings();

  if (!settings.robots.indexSite) {
    return renderUrlset([]);
  }

  if (name === "pages") {
    const [pages, blog] = await Promise.all([
      fetchJson<PageSitemap>("/content/pages", { pages: [] }),
      fetchJson<BlogSitemap>("/content/blog/sitemap", { categories: [], posts: [] }),
    ]);
    // /faq renders the "faq" CMS page and /blog lists posts; without content they are noindex.
    const hasContent = (path: string) =>
      (path !== "/faq" || pages.pages.some((page) => page.slug === "faq")) &&
      (path !== "/blog" || blog.posts.length > 0);
    return renderUrlset([
      ...STATIC_PATHS.filter(
        (entry) =>
          hasContent(entry.path) &&
          settings.pages.find((page) => page.path === (entry.path || "/"))?.seo?.robotsIndex !==
            false,
      ).map((entry) => ({
        changefreq: entry.changefreq,
        loc: `${siteUrl}${entry.path}`,
        priority: entry.priority,
      })),
      ...pages.pages
        .filter((page) => page.seo?.robotsIndex !== false && page.slug !== "faq")
        .map((page) => ({
          changefreq: "monthly" as const,
          lastmod: isoDate(page.updatedAt),
          loc: `${siteUrl}/${page.kind === "policy" ? "policies" : "pages"}/${page.slug}`,
          priority: 0.3,
        })),
    ]);
  }

  const data = await getSitemapData();

  const productMatch = /^products-(\d+)$/.exec(name);
  if (productMatch) {
    const index = Number(productMatch[1]) - 1;
    const slice = data.products.slice(index * SITEMAP_CHUNK, (index + 1) * SITEMAP_CHUNK);
    if (index < 0 || (index > 0 && !slice.length)) return null;
    return renderUrlset(
      slice.map((product) => ({
        changefreq: "weekly",
        images: (product.images ?? []).map((image) => ({
          title: image.alt ?? product.name,
          url: image.url,
        })),
        lastmod: isoDate(product.updatedAt),
        loc: `${siteUrl}/shop/${product.slug}`,
        priority: 0.8,
      })),
    );
  }

  if (name === "categories" || name === "collections") {
    const items = name === "categories" ? data.categories : data.collections;
    return renderUrlset(
      items.map((item) => ({
        changefreq: "weekly",
        lastmod: isoDate(item.updatedAt),
        loc: `${siteUrl}/${name}/${item.slug}`,
        priority: 0.7,
      })),
    );
  }

  if (name === "blog") {
    const blog = await fetchJson<BlogSitemap>("/content/blog/sitemap", {
      categories: [],
      posts: [],
    });
    return renderUrlset([
      ...blog.posts.map((post) => ({
        changefreq: "monthly" as const,
        images: post.featuredImage?.url?.startsWith("https://")
          ? [{ title: post.title, url: post.featuredImage.url }]
          : [],
        lastmod: isoDate(post.updatedAt),
        loc: `${siteUrl}/blog/${post.slug}`,
        priority: 0.6,
      })),
    ]);
  }

  return null;
}
