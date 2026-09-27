import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { fetchCmsPages } from "@/lib/content";

export const metadata = { title: "Policies" };

export default async function PoliciesPage() {
  const { pages } = await fetchCmsPages("policy");
  return (
    <PublicPageFrame eyebrow="Legal" title="Policies" description="Shop, shipping, privacy and return policies.">
      <Breadcrumbs items={[{ name: "Policies", path: "/policies" }]} />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {pages.map((page) => <Link className="rounded-md border border-[#e5dac7] bg-[#fffaf1] p-4 font-semibold" href={`/policies/${page.slug}`} key={page.slug}>{page.title}</Link>)}
      </div>
    </PublicPageFrame>
  );
}
