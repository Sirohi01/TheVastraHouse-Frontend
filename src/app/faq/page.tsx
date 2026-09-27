import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsRichPage } from "@/components/content/CmsRichPage";
import { fetchCmsPage } from "@/lib/content";
import { buildPageMetadata, getSeoSettings } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSeoSettings();
  try {
    const { page } = await fetchCmsPage("faq");
    return buildPageMetadata(settings, { description: page.summary, name: page.title, path: "/faq", seo: page.seo });
  } catch {
    return buildPageMetadata(settings, { description: "Frequently asked questions.", name: "FAQ", path: "/faq" });
  }
}

export default async function FaqPage() {
  try {
    const { page } = await fetchCmsPage("faq");
    return <CmsRichPage page={page} path="/faq" />;
  } catch {
    notFound();
  }
}
