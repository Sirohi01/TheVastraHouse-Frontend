import { CatalogPage } from "@/components/catalog/CatalogPage";
import type { CatalogQuery } from "@/lib/catalog";
import { defaultCmsContent, fetchCmsContent } from "@/lib/cms";

export const dynamic = "force-dynamic";

type ShopPageProps = {
  searchParams?: Promise<CatalogQuery & { view?: string }>;
};

export default async function ShopPage({ searchParams }: Readonly<ShopPageProps>) {
  const query = (await searchParams) ?? {};
  const content = await loadCmsContent();
  const shop = { ...defaultCmsContent.shop, ...content.shop };

  return (
    <CatalogPage
      bannerStyle={shop}
      description={shop.description ?? ""}
      eyebrow={shop.eyebrow}
      heroMedia={shop.media}
      query={query}
      title={shop.title ?? "Shop The Collection"}
    />
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
