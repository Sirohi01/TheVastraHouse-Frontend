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
      path: `/policies/${slug}`,
      seo: page.seo,
    });
  } catch {
    return buildPageMetadata(settings, {
      name: "Policy",
      noindex: true,
      path: `/policies/${slug}`,
    });
  }
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const page = await fetchCmsPage(slug)
    .then((payload) => payload.page)
    .catch(() => notFound());
  if (page.kind !== "policy") permanentRedirect(`/pages/${slug}`);
  return (
    <CmsRichPage
      breadcrumbParent={{ name: "Policies", path: "/policies" }}
      page={page}
      path={`/policies/${slug}`}
    />
  );
}
