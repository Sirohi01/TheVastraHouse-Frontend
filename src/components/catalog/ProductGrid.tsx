import { EmptyState } from "@/components/states/EmptyState";
import { ProductCard } from "@/components/catalog/ProductCard";
import type { CatalogProduct } from "@/lib/catalog";

export function ProductGrid({
  products,
  view,
}: Readonly<{ products: CatalogProduct[]; view: "grid" | "list" }>) {
  if (!products.length) {
    return (
      <EmptyState
        title="No products found"
        message="Try changing the filters or clearing the search."
      />
    );
  }

  return (
    <div
      className={
        view === "grid"
          ? "grid gap-y-4 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-7 lg:grid-cols-3 2xl:grid-cols-4"
          : "grid gap-3 sm:gap-4"
      }
    >
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} view={view} />
      ))}
    </div>
  );
}
