import { notFound } from "next/navigation";
import { AdminContentClient, type ContentTab } from "@/components/cms/AdminContentClient";

const contentSections = new Set<ContentTab>([
  "home",
  "about",
  "shop",
  "preOrder",
  "navigation",
  "footer",
  "testimonials",
  "faqs",
  "policies",
]);

export default async function AdminContentSectionPage({
  params,
}: Readonly<{ params: Promise<{ section: string }> }>) {
  const { section } = await params;

  if (!contentSections.has(section as ContentTab)) {
    notFound();
  }

  return <AdminContentClient initialTab={section as ContentTab} />;
}
