import type { Metadata } from "next";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { defaultCmsContent, fetchCmsContent } from "@/lib/cms";
import { buildCollectionPageJsonLd, buildPageMetadata, getSeoSettings } from "@/lib/seo";

export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  const [settings, content] = await Promise.all([getSeoSettings(), loadCmsContent()]);
  const preOrder = { ...defaultCmsContent.preOrder, ...content.preOrder };
  return buildPageMetadata(settings, {
    description:
      preOrder.description ||
      "Pre-order upcoming designs from The Vastra House before they launch.",
    name: preOrder.title || "Pre-Order",
    path: "/pre-order",
  });
}

export default async function PreOrderPage() {
  const content = await loadCmsContent();
  const preOrder = { ...defaultCmsContent.preOrder, ...content.preOrder };

  return (
    <CatalogPage
      bannerStyle={preOrder}
      breadcrumbs={[{ name: preOrder.title ?? "Pre-Order", path: "/pre-order" }]}
      description={preOrder.description ?? ""}
      eyebrow={preOrder.eyebrow}
      heroMedia={preOrder.media}
      onProducts={(products) => (
        <JsonLd
          data={buildCollectionPageJsonLd({
            description: preOrder.description,
            name: preOrder.title ?? "Pre-Order",
            path: "/pre-order",
            products: products.data,
          })}
        />
      )}
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
