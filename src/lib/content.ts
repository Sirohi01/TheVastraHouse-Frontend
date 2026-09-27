import { apiBaseUrl } from "@/lib/api";
import type { MediaReference } from "@/lib/catalog";
import type { EntitySeo } from "@/lib/seo";

export type CmsFaq = { question: string; answer: string };
export type CmsPage = {
  _id: string;
  slug: string;
  title: string;
  kind: "page" | "policy";
  summary?: string;
  body: string;
  heroImage?: MediaReference;
  faqs?: CmsFaq[];
  seo?: EntitySeo;
  updatedAt?: string;
};

export type BlogTaxonomyItem = { _id?: string; name: string; slug: string; description?: string };
export type BlogTag = { tag: string; count: number };
export type BlogPostSummary = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: MediaReference;
  categoryId?: BlogTaxonomyItem;
  tags?: string[];
  publishedAt?: string;
  readingMinutes?: number;
  updatedAt?: string;
};
export type BlogPostDetail = BlogPostSummary & {
  content: string;
  authorId?: { name: string; slug?: string; bio?: string; avatar?: MediaReference };
  faqs?: CmsFaq[];
  seo?: EntitySeo;
};

export type PaginatedContent<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

async function contentFetch<T>(path: string, fallback?: T): Promise<T> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, { next: { revalidate: 60 } });
    if (!response.ok) {
      if (fallback !== undefined) return fallback;
      throw new Error("Content unavailable");
    }
    return response.json() as Promise<T>;
  } catch {
    if (fallback !== undefined) return fallback;
    throw new Error("Content unavailable");
  }
}

export function fetchCmsPage(slug: string) {
  return contentFetch<{ page: CmsPage }>(`/content/pages/${encodeURIComponent(slug)}`);
}

export function fetchCmsPages(kind?: "page" | "policy") {
  const query = kind ? `?kind=${kind}` : "";
  return contentFetch<{ pages: Array<Omit<CmsPage, "body">> }>(`/content/pages${query}`, { pages: [] });
}

export function fetchBlogPosts(input: { page?: string; category?: string; tag?: string }) {
  const params = new URLSearchParams();
  if (input.page) params.set("page", input.page);
  if (input.category) params.set("category", input.category);
  if (input.tag) params.set("tag", input.tag);
  return contentFetch<PaginatedContent<BlogPostSummary>>(`/content/blog?${params.toString()}`, {
    data: [],
    meta: { limit: 20, page: 1, total: 0, totalPages: 0 },
  });
}

export function fetchBlogTaxonomy() {
  return contentFetch<{ categories: BlogTaxonomyItem[]; tags: BlogTag[] }>("/content/blog/taxonomy", {
    categories: [],
    tags: [],
  });
}

export function fetchBlogPost(slug: string) {
  return contentFetch<{ post: BlogPostDetail; relatedPosts: BlogPostSummary[]; relatedProducts: unknown[] }>(
    `/content/blog/${encodeURIComponent(slug)}`,
  );
}

export function submitContact(input: {
  name: string;
  email: string;
  phone?: string;
  category: string;
  subject: string;
  message: string;
  orderNumber?: string;
  website?: string;
}) {
  return fetch(`${apiBaseUrl}/engagement/contact`, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}
