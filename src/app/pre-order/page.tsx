import { CatalogPage } from "@/components/catalog/CatalogPage";
import { defaultCmsContent, fetchCmsContent } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function PreOrderPage() {
  const content = await loadCmsContent();
  const preOrder = { ...defaultCmsContent.preOrder, ...content.preOrder };

  return (
    <CatalogPage
      bannerStyle={preOrder}
      description={preOrder.description ?? ""}
      eyebrow={preOrder.eyebrow}
      heroMedia={preOrder.media}
      imageOnlyBanners
      query={{ preOrder: "true", sort: "-newest" }}
      title={preOrder.title ?? "Pre-Order"}
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
