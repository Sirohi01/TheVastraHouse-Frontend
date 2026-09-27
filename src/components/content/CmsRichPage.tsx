import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { JsonLd } from "@/components/seo/JsonLd";
import { ContentFaqs } from "@/components/content/ContentFaqs";
import type { CmsPage } from "@/lib/content";
import { buildFaqJsonLd, buildWebPageJsonLd } from "@/lib/seo";

export function CmsRichPage({
  breadcrumbParent,
  page,
  path,
}: Readonly<{ breadcrumbParent?: { name: string; path: string }; page: CmsPage; path: string }>) {
  const crumbs = breadcrumbParent
    ? [breadcrumbParent, { name: page.title, path }]
    : [{ name: page.title, path }];

  return (
    <PublicPageFrame eyebrow={page.kind === "policy" ? "Policy" : "The Vastra House"} title={page.title} description={page.summary}>
      <div className="mb-5">
        <Breadcrumbs items={crumbs} />
      </div>
      <JsonLd data={buildWebPageJsonLd({ dateModified: page.updatedAt, description: page.summary, name: page.title, path })} />
      <JsonLd data={buildFaqJsonLd(page.faqs ?? [])} />
      <article className="rounded-md border border-[#e5dac7] bg-[#fffaf1] p-5 text-sm leading-7 text-[#4f443a] sm:p-7">
        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: page.body }} />
      </article>
      <ContentFaqs faqs={page.faqs ?? []} />
    </PublicPageFrame>
  );
}
