import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductDetailClient } from "@/components/catalog/ProductDetailClient";
import { getProductPdp, getProductReviews, type PdpResponse } from "@/lib/catalog";
import { applyManagedRedirect } from "@/lib/redirects";
import { buildPageMetadata, buildProductJsonLd, getSeoSettings } from "@/lib/seo";

export const revalidate = 30;

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

async function loadPdp(slug: string): Promise<PdpResponse | null> {
  try {
    return await getProductPdp(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Readonly<ProductPageProps>): Promise<Metadata> {
  const { slug } = await params;
  const [settings, pdp] = await Promise.all([getSeoSettings(), loadPdp(slug)]);

  if (!pdp) {
    return { robots: { follow: false, index: false }, title: "Product not found" };
  }

  const { product } = pdp;
  const image =
    product.media?.find((item) => item.type === "image") ?? product.variants[0]?.media?.[0];

  return buildPageMetadata(settings, {
    description: product.shortDescription ?? product.description,
    image,
    name: product.name,
    path: `/shop/${product.slug}`,
    seo: product.seo,
  });
}

export default async function ProductPage({ params }: Readonly<ProductPageProps>) {
  const { slug } = await params;
  const pdp = await loadPdp(slug);

  if (!pdp) {
    await applyManagedRedirect(`/shop/${slug}`);
    notFound();
  }

  const [reviews, settings] = await Promise.all([
    getProductReviews(slug).catch(() => ({
      data: [],
      meta: undefined,
      summary: { average: 0, count: 0, distribution: {} },
    })),
    getSeoSettings(),
  ]);
  const primaryCategory = pdp.product.categoryIds?.[0];

  return (
    <>
      {pdp.product.seo?.schemaEnabled !== false ? (
        <JsonLd
          data={buildProductJsonLd(
            pdp.product,
            reviews.summary,
            settings.brandName,
            settings.commerce,
          )}
        />
      ) : null}
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Shop", path: "/shop" },
            ...(primaryCategory
              ? [{ name: primaryCategory.name, path: `/categories/${primaryCategory.slug}` }]
              : []),
            { name: pdp.product.name, path: `/shop/${pdp.product.slug}` },
          ]}
        />
      </div>
      <ProductDetailClient pdp={pdp} reviewSummary={reviews.summary} reviews={reviews.data} />
    </>
  );
}
