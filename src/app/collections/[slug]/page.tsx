import type { Metadata } from "next";
import { TaxonomyListingPage, taxonomyMetadata } from "@/components/catalog/TaxonomyListingPage";
import type { CatalogQuery } from "@/lib/catalog";

export const revalidate = 60;

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<CatalogQuery & { view?: string }>;
};

export async function generateMetadata({ params, searchParams }: Readonly<CollectionPageProps>): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  return taxonomyMetadata("collections", slug, (query ?? {}) as Record<string, string | undefined>);
}

export default async function CollectionPage({ params, searchParams }: Readonly<CollectionPageProps>) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  return <TaxonomyListingPage kind="collections" query={query ?? {}} slug={slug} />;
}
