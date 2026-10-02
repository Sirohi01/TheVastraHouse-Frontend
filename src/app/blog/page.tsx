import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { JsonLd } from "@/components/seo/JsonLd";
import { fetchBlogPosts, fetchBlogTaxonomy } from "@/lib/content";
import { buildPageMetadata, buildWebPageJsonLd, getSeoSettings } from "@/lib/seo";

type Props = Readonly<{
  searchParams: Promise<{ page?: string; category?: string; tag?: string }>;
}>;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = await searchParams;
  const [settings, posts] = await Promise.all([getSeoSettings(), fetchBlogPosts(query)]);
  return buildPageMetadata(settings, {
    description: "Stories, guides and styling notes from The Vastra House.",
    isVariantUrl: Boolean(query.page || query.category || query.tag),
    name: "Blog",
    // An empty listing is thin content; it becomes indexable with the first published post.
    noindex: !posts.data.length,
    path: "/blog",
  });
}

export default async function BlogPage({ searchParams }: Props) {
  const query = await searchParams;
  const [{ data, meta }, taxonomy] = await Promise.all([
    fetchBlogPosts(query),
    fetchBlogTaxonomy(),
  ]);
  return (
    <PublicPageFrame
      eyebrow="Journal"
      title="Blog"
      description="Stories, styling guides and care notes."
    >
      <Breadcrumbs items={[{ name: "Blog", path: "/blog" }]} />
      <JsonLd
        data={buildWebPageJsonLd({
          description: "Stories, styling guides and care notes.",
          name: "Blog",
          path: "/blog",
        })}
      />
      <div className="mt-5 flex flex-wrap gap-2">
        {taxonomy.categories.map((category) => (
          <Link
            className="rounded-full border border-border px-3 py-1 text-sm font-semibold"
            href={`/blog?category=${category.slug}`}
            key={category.slug}
          >
            {category.name}
          </Link>
        ))}
        {taxonomy.tags.slice(0, 12).map((tag) => (
          <Link
            className="rounded-full border border-border px-3 py-1 text-sm font-semibold"
            href={`/blog?tag=${tag.tag}`}
            key={tag.tag}
          >
            #{tag.tag}
          </Link>
        ))}
      </div>
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {data.map((post) => (
          <Link
            className="overflow-hidden rounded-md border border-[#e5dac7] bg-[#fffaf1]"
            href={`/blog/${post.slug}`}
            key={post.slug}
          >
            {post.featuredImage?.url ? (
              <ResponsiveImage
                alt={post.featuredImage.altText ?? post.title}
                aspectRatio={post.featuredImage.aspectRatio ?? "16:9"}
                src={post.featuredImage.url}
              />
            ) : null}
            <div className="p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {post.categoryId?.name ?? "Journal"} · {post.readingMinutes ?? 1} min
              </p>
              <h2 className="mt-2 font-serif text-xl uppercase text-[#3d1620]">{post.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#6f6256]">{post.excerpt}</p>
            </div>
          </Link>
        ))}
      </section>
      {meta.totalPages > 1 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Page {meta.page} of {meta.totalPages}
        </p>
      ) : null}
    </PublicPageFrame>
  );
}
