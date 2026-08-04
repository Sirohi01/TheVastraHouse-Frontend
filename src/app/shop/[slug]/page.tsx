import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductDetailClient } from "@/components/catalog/ProductDetailClient";
import { ErrorState } from "@/components/states/ErrorState";
import { getProductPdp, getProductReviews } from "@/lib/catalog";
import { buildBreadcrumbJsonLd, buildProductJsonLd, getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Readonly<ProductPageProps>): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { product } = await getProductPdp(slug);
    const title = product.seo?.title ?? product.name;
    const description = product.seo?.description ?? product.shortDescription ?? product.description;

    return {
      title,
      description,
      alternates: { canonical: product.seo?.canonicalUrl ?? `${getSiteUrl()}/shop/${slug}` },
    };
  } catch {
    return {};
  }
}

export default async function ProductPage({ params }: Readonly<ProductPageProps>) {
  const { slug } = await params;

  try {
    const [pdp, reviews] = await Promise.all([getProductPdp(slug), getProductReviews(slug)]);

    return (
      <>
        <JsonLd data={buildProductJsonLd(pdp.product, reviews.data)} />
        <JsonLd
          data={buildBreadcrumbJsonLd([
            { name: "Shop", path: "/shop" },
            { name: pdp.product.name, path: `/shop/${pdp.product.slug}` },
          ])}
        />
        <ProductDetailClient pdp={pdp} reviews={reviews.data} />
      </>
    );
  } catch (error) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-144px)] max-w-4xl items-center px-4 sm:px-6 lg:px-8">
        <ErrorState
          title="Product could not load"
          message={error instanceof Error ? error.message : "Product request failed"}
        />
      </main>
    );
  }
}
