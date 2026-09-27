import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCategory, getCollection, type CatalogQuery, type TaxonomyRef } from "@/lib/catalog";
import { applyManagedRedirect } from "@/lib/redirects";
import { buildCollectionPageJsonLd, buildPageMetadata, getSeoSettings, hasIndexBlockingParams } from "@/lib/seo";

type Kind = "categories" | "collections";

async function loadTaxonomy(kind: Kind, slug: string): Promise<TaxonomyRef | null> {
  try {
    return kind === "categories" ? (await getCategory(slug)).category : (await getCollection(slug)).collection;
  } catch {
    return null;
  }
}

/** Shared metadata for category and collection listings (facet-aware canonical/robots). */
export async function taxonomyMetadata(kind: Kind, slug: string, query: Record<string, string | undefined>): Promise<Metadata> {
  const [settings, taxonomy] = await Promise.all([getSeoSettings(), loadTaxonomy(kind, slug)]);

  if (!taxonomy) {
    return { robots: { follow: false, index: false }, title: "Not found" };
  }

  const page = Number(query.page ?? "1");
  const variant = hasIndexBlockingParams({ ...query, page: undefined, view: undefined });
  const basePath = `/${kind}/${taxonomy.slug}`;

  return buildPageMetadata(settings, {
    description: taxonomy.description ?? `Shop ${taxonomy.name} at ${settings.siteName}.`,
    image: taxonomy.banner,
    isVariantUrl: variant,
    name: page > 1 ? `${taxonomy.name} — page ${page}` : taxonomy.name,
    path: !variant && page > 1 ? `${basePath}?page=${page}` : basePath,
    seo: page > 1 ? { ...taxonomy.seo, canonicalUrl: undefined, title: undefined } : taxonomy.seo,
  });
}

export async function TaxonomyListingPage({
  kind,
  query,
  slug,
}: Readonly<{ kind: Kind; slug: string; query: CatalogQuery & { view?: string } }>) {
  const taxonomy = await loadTaxonomy(kind, slug);

  if (!taxonomy?._id) {
    await applyManagedRedirect(`/${kind}/${slug}`);
    notFound();
  }

  const path = `/${kind}/${taxonomy.slug}`;
  const schemaEnabled = taxonomy.seo?.schemaEnabled !== false;

  return (
    <CatalogPage
      bottomContent={taxonomy.bottomContent}
      breadcrumbs={[
        { name: "Shop", path: "/shop" },
        { name: taxonomy.name, path },
      ]}
      description={taxonomy.description ?? `Products in ${taxonomy.name}.`}
      faqs={taxonomy.faqs}
      heroMedia={taxonomy.banner}
      introContent={taxonomy.introContent}
      onProducts={(products) =>
        schemaEnabled ? (
          <JsonLd
            data={buildCollectionPageJsonLd({
              description: taxonomy.description,
              name: taxonomy.name,
              path,
              products: products.data,
            })}
          />
        ) : null
      }
      query={{ ...query, [kind === "categories" ? "categoryId" : "collectionId"]: taxonomy._id }}
      title={taxonomy.name}
    />
  );
}
