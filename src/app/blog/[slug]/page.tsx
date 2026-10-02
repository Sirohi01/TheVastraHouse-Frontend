import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { JsonLd } from "@/components/seo/JsonLd";
import { fetchBlogPost } from "@/lib/content";
import { buildArticleJsonLd, buildFaqJsonLd, buildPageMetadata, getSeoSettings } from "@/lib/seo";

type Props = Readonly<{ params: Promise<{ slug: string }> }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const settings = await getSeoSettings();
  try {
    const { post } = await fetchBlogPost(slug);
    return buildPageMetadata(settings, {
      description: post.excerpt,
      image: post.featuredImage,
      modifiedTime: post.updatedAt,
      name: post.title,
      path: `/blog/${slug}`,
      publishedTime: post.publishedAt,
      seo: post.seo,
      type: "article",
    });
  } catch {
    return buildPageMetadata(settings, { name: "Article", noindex: true, path: `/blog/${slug}` });
  }
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const settings = await getSeoSettings();
  try {
    const { post, relatedPosts } = await fetchBlogPost(slug);
    return (
      <PublicPageFrame
        eyebrow={post.categoryId?.name ?? "Journal"}
        title={post.title}
        description={post.excerpt}
      >
        <Breadcrumbs
          items={[
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${slug}` },
          ]}
        />
        <JsonLd
          data={buildArticleJsonLd({
            authorName: post.authorId?.name,
            dateModified: post.updatedAt,
            datePublished: post.publishedAt,
            description: post.excerpt,
            headline: post.title,
            image: post.featuredImage?.url,
            path: `/blog/${slug}`,
            publisherLogo: settings.organization.logo,
            publisherName: settings.brandName,
          })}
        />
        <JsonLd data={buildFaqJsonLd(post.faqs ?? [])} />
        {post.featuredImage?.url ? (
          <ResponsiveImage
            alt={post.featuredImage.altText ?? post.title}
            aspectRatio={post.featuredImage.aspectRatio ?? "16:9"}
            className="mb-5 rounded-md border border-[#e5dac7]"
            priority
            src={post.featuredImage.url}
          />
        ) : null}
        <article
          className="rounded-md border border-[#e5dac7] bg-[#fffaf1] p-5 text-sm leading-7 text-[#4f443a] sm:p-7"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        {relatedPosts.length ? (
          <section className="mt-6 grid gap-3 sm:grid-cols-3">
            {relatedPosts.map((related) => (
              <Link
                className="rounded-md border border-border bg-card p-4 font-semibold"
                href={`/blog/${related.slug}`}
                key={related.slug}
              >
                {related.title}
              </Link>
            ))}
          </section>
        ) : null}
      </PublicPageFrame>
    );
  } catch {
    notFound();
  }
}
