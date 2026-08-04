import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { ErrorState } from "@/components/states/ErrorState";
import { getCategory, type CatalogQuery } from "@/lib/catalog";
import { buildBreadcrumbJsonLd, getSiteUrl } from "@/lib/seo";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<CatalogQuery & { view?: string }>;
};

export async function generateMetadata({ params }: Readonly<CategoryPageProps>): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { category } = await getCategory(slug);
    const title = category.seo?.title ?? category.name;
    const description = category.seo?.description ?? category.description;

    return {
      title,
      description,
      alternates: { canonical: category.seo?.canonicalUrl ?? `${getSiteUrl()}/categories/${slug}` },
    };
  } catch {
    return {};
  }
}

export default async function CategoryPage({ params, searchParams }: Readonly<CategoryPageProps>) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};

  try {
    const { category } = await getCategory(slug);

    return (
      <>
        <JsonLd
          data={buildBreadcrumbJsonLd([
            { name: "Shop", path: "/shop" },
            { name: category.name, path: `/categories/${category.slug}` },
          ])}
        />
        <CatalogPage
          description={category.description ?? `Products in ${category.name}.`}
          query={{ ...query, categoryId: category._id }}
          title={category.name}
        />
      </>
    );
  } catch (error) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-144px)] max-w-4xl items-center px-4 sm:px-6 lg:px-8">
        <ErrorState
          title="Category could not load"
          message={error instanceof Error ? error.message : "Category request failed"}
        />
      </main>
    );
  }
}
