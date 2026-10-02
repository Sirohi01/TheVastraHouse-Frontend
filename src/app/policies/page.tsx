import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { JsonLd } from "@/components/seo/JsonLd";
import { fetchCmsPages } from "@/lib/content";
import { buildPageMetadata, buildWebPageJsonLd, getSeoSettings } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSeoSettings();
  return buildPageMetadata(settings, {
    description: "Shipping, returns, privacy and terms policies of The Vastra House.",
    name: "Policies",
    path: "/policies",
  });
}

export default async function PoliciesPage() {
  const { pages } = await fetchCmsPages("policy");
  return (
    <PublicPageFrame
      eyebrow="Legal"
      title="Policies"
      description="Shop, shipping, privacy and return policies."
    >
      <Breadcrumbs items={[{ name: "Policies", path: "/policies" }]} />
      <JsonLd
        data={buildWebPageJsonLd({
          description: "Shipping, returns, privacy and terms policies of The Vastra House.",
          name: "Policies",
          path: "/policies",
        })}
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {pages.map((page) => (
          <Link
            className="rounded-md border border-[#e5dac7] bg-[#fffaf1] p-4 font-semibold"
            href={`/policies/${page.slug}`}
            key={page.slug}
          >
            {page.title}
          </Link>
        ))}
      </div>
    </PublicPageFrame>
  );
}
