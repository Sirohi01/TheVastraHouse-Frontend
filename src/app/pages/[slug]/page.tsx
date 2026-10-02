import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CmsRichPage } from "@/components/content/CmsRichPage";
import { fetchCmsPage } from "@/lib/content";
import { buildPageMetadata, getSeoSettings } from "@/lib/seo";

type Props = Readonly<{ params: Promise<{ slug: string }> }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const settings = await getSeoSettings();
  try {
    const { page } = await fetchCmsPage(slug);
    return buildPageMetadata(settings, {
      description: page.summary,
      name: page.title,
      path: `/pages/${slug}`,
      seo: page.seo,
    });
  } catch {
    return buildPageMetadata(settings, { name: "Page", noindex: true, path: `/pages/${slug}` });
  }
}

export default async function CmsPageRoute({ params }: Props) {
  const { slug } = await params;
  const page = await fetchCmsPage(slug)
    .then((payload) => payload.page)
    .catch(() => notFound());
  // Each CMS page has one URL: policies are served (and indexed) under /policies, FAQ at /faq.
  if (page.kind === "policy") permanentRedirect(`/policies/${slug}`);
  if (slug === "faq") permanentRedirect("/faq");
  return <CmsRichPage page={page} path={`/pages/${slug}`} />;
}
