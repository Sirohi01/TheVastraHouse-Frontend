import type { Metadata } from "next";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { SearchTracker } from "@/components/analytics/SearchTracker";
import type { CatalogQuery } from "@/lib/catalog";
import { defaultCmsContent, fetchCmsContent } from "@/lib/cms";
import {
  buildCollectionPageJsonLd,
  buildPageMetadata,
  getSeoSettings,
  hasIndexBlockingParams,
} from "@/lib/seo";

type ShopPageProps = {
  searchParams?: Promise<CatalogQuery & { view?: string; q?: string }>;
};

/**
 * Facet policy: /shop and /shop?page=N are indexable (self-canonical per page); any filter,
 * sort or search variant is noindex,follow and canonicalises to /shop.
 */
export async function generateMetadata({
  searchParams,
}: Readonly<ShopPageProps>): Promise<Metadata> {
  const [settings, query, content] = await Promise.all([
    getSeoSettings(),
    searchParams,
    loadCmsContent(),
  ]);
  const params = (query ?? {}) as Record<string, string | undefined>;
  const page = Number(params.page ?? "1");
  const isSearch = Boolean(params.q ?? params.search);
  const variant = hasIndexBlockingParams({ ...params, page: undefined, view: undefined });
  const shop = { ...defaultCmsContent.shop, ...content.shop };

  return buildPageMetadata(settings, {
    description:
      shop.description ??
      "Shop soft-luxury Indian wear: kurtas, sarees, co-ords and festive edits.",
    isVariantUrl: variant || isSearch,
    name: isSearch
      ? `Search results for “${params.q ?? params.search}”`
      : page > 1
        ? `Shop — page ${page}`
        : (shop.title ?? "Shop"),
    path: !variant && page > 1 ? `/shop?page=${page}` : "/shop",
  });
}

export default async function ShopPage({ searchParams }: Readonly<ShopPageProps>) {
  const query = (await searchParams) ?? {};
  const content = await loadCmsContent();
  const shop = { ...defaultCmsContent.shop, ...content.shop };
  const searchTerm = query.q ?? query.search;

  return (
    <>
      {searchTerm ? <SearchTracker term={searchTerm} /> : null}
      <CatalogPage
        bannerStyle={shop}
        breadcrumbs={[{ name: searchTerm ? "Search" : "Shop", path: "/shop" }]}
        description={shop.description ?? ""}
        eyebrow={shop.eyebrow}
        heroMedia={shop.media}
        onProducts={(products) =>
          searchTerm ? null : (
            <JsonLd
              data={buildCollectionPageJsonLd({
                description: shop.description,
                name: shop.title ?? "Shop",
                path: "/shop",
                products: products.data,
              })}
            />
          )
        }
        query={query}
        title={searchTerm ? `Results for “${searchTerm}”` : (shop.title ?? "Shop The Collection")}
      />
    </>
  );
}

async function loadCmsContent() {
  try {
    const payload = await fetchCmsContent("storefront-main");
    return payload.content ?? defaultCmsContent;
  } catch {
    return defaultCmsContent;
  }
}
