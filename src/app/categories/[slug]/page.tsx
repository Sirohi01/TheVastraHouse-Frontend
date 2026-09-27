import type { Metadata } from "next";
import { TaxonomyListingPage, taxonomyMetadata } from "@/components/catalog/TaxonomyListingPage";
import type { CatalogQuery } from "@/lib/catalog";

export const revalidate = 60;

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<CatalogQuery & { view?: string }>;
};

export async function generateMetadata({ params, searchParams }: Readonly<CategoryPageProps>): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  return taxonomyMetadata("categories", slug, (query ?? {}) as Record<string, string | undefined>);
}

export default async function CategoryPage({ params, searchParams }: Readonly<CategoryPageProps>) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  return <TaxonomyListingPage kind="categories" query={query ?? {}} slug={slug} />;
}
