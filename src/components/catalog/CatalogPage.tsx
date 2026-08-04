import { Search } from "lucide-react";
import { CatalogToolbar } from "@/components/catalog/CatalogToolbar";
import { FilterSidebar } from "@/components/catalog/FilterSidebar";
import { Pagination } from "@/components/catalog/Pagination";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { ErrorState } from "@/components/states/ErrorState";
import type { CmsCatalogPage } from "@/lib/cms";
import { getCatalogFilters, getProducts, type CatalogQuery, type MediaReference } from "@/lib/catalog";

const heroImage = "/images/home-hero.jpg";

export async function CatalogPage({
  description,
  eyebrow,
  bannerStyle,
  heroMedia,
  imageOnlyBanners = false,
  query,
  title,
}: Readonly<{
  description: string;
  eyebrow?: string;
  bannerStyle?: CmsCatalogPage;
  heroMedia?: MediaReference | null;
  imageOnlyBanners?: boolean;
  query: CatalogQuery & { view?: string };
  title: string;
}>) {
  const view = query.view === "list" ? "list" : "grid";
  const catalogQuery: CatalogQuery = {
    categoryId: query.categoryId,
    collectionId: query.collectionId,
    color: query.color,
    fabric: query.fabric,
    maxPrice: query.maxPrice,
    minPrice: query.minPrice,
    page: query.page,
    preOrder: query.preOrder,
    search: query.search,
    size: query.size,
    sort: query.sort ?? "-newest",
    tagId: query.tagId,
    view,
  };

  try {
    const [products, filters] = await Promise.all([
      getProducts({ ...catalogQuery, limit: "12" }),
      getCatalogFilters(),
    ]);

    return (
      <main className="bg-[#fbf7ef]">
        <section className="mx-auto max-w-7xl px-5 py-6">
          <div className="relative overflow-hidden rounded-sm border border-[#e1d6c4] shadow-[0_24px_60px_-46px_rgba(46,12,18,0.6)]">
            <ResponsiveImage
              alt={heroMedia?.altText ?? `${title} banner`}
              aspectRatio="16 / 7"
              objectFit={heroMedia?.objectFit}
              priority
              sizes="100vw"
              src={heroMedia?.url ?? heroImage}
            />

            {/* Royal inset frame + corner filigree */}
            <div
              className={
                imageOnlyBanners || bannerStyle?.showOutline === false
                  ? "hidden"
                  : "pointer-events-none absolute inset-3 hidden border border-[#caa14e]/45 md:block md:inset-5"
              }
            >
              <CornerFiligree className="absolute -left-px -top-px text-[#caa14e]/85" />
              <CornerFiligree className="absolute -right-px -top-px rotate-90 text-[#caa14e]/85" />
              <CornerFiligree className="absolute -bottom-px -right-px rotate-180 text-[#caa14e]/85" />
              <CornerFiligree className="absolute -bottom-px -left-px -rotate-90 text-[#caa14e]/85" />
            </div>

            <div
              className={
                imageOnlyBanners
                  ? "hidden"
                  : "absolute inset-0 hidden items-center px-7 md:flex md:px-10"
              }
            >
              <div
                className={`max-w-xl ${catalogContentAlignment(bannerStyle?.contentPosition)} ${
                  bannerStyle?.fontFamily === "sans" ? "" : "font-serif"
                }`}
                style={{ color: bannerStyle?.textColor ?? "#ffffff" }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-current opacity-80">
                  {eyebrow ?? "The Vastra House"}
                </p>
                <div className="mt-4 flex items-center gap-2 text-[#caa14e]">
                  <span className="h-px w-10 bg-[#caa14e]" />
                  <span aria-hidden="true">✦</span>
                  <span className="h-px w-6 bg-[#caa14e]/60" />
                </div>
                <h1
                  className={`mt-3 uppercase leading-tight drop-shadow-sm ${catalogTitleSize(bannerStyle?.fontSize)}`}
                >
                  {title}
                </h1>
                <p
                  className={`mt-4 max-w-md leading-7 text-current opacity-[.88] ${catalogCopySize(bannerStyle?.copyFontSize)}`}
                >
                  {description}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-10">
          <div className="mb-4 rounded-sm border border-[#caa14e]/50 bg-[#fffaf1] p-4 text-sm leading-6 text-[#6f6256]">
            <p className="font-serif text-lg uppercase tracking-wide text-[#3d1620]">
              Pre-orders only right now
            </p>
            <p className="mt-1">
              You can browse all products, but checkout is currently enabled only for products with
              active pre-order slots.
            </p>
          </div>
          <div className="overflow-hidden rounded-sm border border-[#e1d6c4] bg-[#fffdf8] shadow-[0_18px_50px_-40px_rgba(46,12,18,0.5)]">
            <div className="grid min-h-14 items-center border-b border-[#e1d6c4] text-sm md:grid-cols-[260px_1fr]">
              <div className="flex items-center gap-2 border-[#e1d6c4] px-5 py-4 md:border-r">
                <span aria-hidden="true" className="text-xs text-[#caa14e]">
                  ❖
                </span>
                <span className="font-serif text-[#3d1620]">
                  <span className="font-semibold text-[#6e1423]">{products.meta.total}</span>{" "}
                  Results
                </span>
              </div>
              <CatalogToolbar query={catalogQuery} total={products.meta.total} view={view} />
            </div>

            <div className="grid md:grid-cols-[260px_1fr]">
              <FilterSidebar filters={filters} query={catalogQuery} />
              <div className="p-5">
                <ProductGrid products={products.data} view={view} />
                {products.data.length ? (
                  <PromoBand imageOnly={imageOnlyBanners} promo={bannerStyle?.promo} />
                ) : null}
                <Pagination meta={products.meta} query={{ ...catalogQuery, view }} />
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  } catch (error) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-144px)] max-w-4xl items-center px-4 sm:px-6 lg:px-8">
        <ErrorState
          title={`${title} could not load`}
          message={error instanceof Error ? error.message : "Catalog request failed"}
        />
      </main>
    );
  }
}

function catalogContentAlignment(position?: CmsCatalogPage["contentPosition"]) {
  if (position === "center") return "mx-auto text-left";
  if (position === "right") return "ml-auto text-left";
  return "text-left";
}

function catalogTitleSize(size?: CmsCatalogPage["fontSize"]) {
  if (size === "sm") return "text-3xl sm:text-4xl";
  if (size === "md") return "text-4xl sm:text-5xl";
  return "text-4xl sm:text-5xl";
}

function catalogCopySize(size?: CmsCatalogPage["copyFontSize"]) {
  if (size === "sm") return "text-sm";
  if (size === "lg") return "text-lg";
  return "text-base";
}

function PromoBand({
  imageOnly = false,
  promo,
}: Readonly<{ imageOnly?: boolean; promo?: CmsCatalogPage["promo"] }>) {
  return (
    <a
      className="group relative mt-8 block overflow-hidden rounded-sm border border-[#e1d6c4]"
      href={promo?.primaryCta?.href ?? "/shop?sort=-bestSelling"}
    >
      <ResponsiveImage
        alt={promo?.media?.altText ?? "Crafted heritage fabric banner"}
        aspectRatio="16 / 7"
        className="transition-transform duration-500 group-hover:scale-105"
        sizes="100vw"
        src={promo?.media?.url ?? heroImage}
      />
      <div
        className={
          imageOnly
            ? "hidden"
            : "pointer-events-none absolute inset-3 hidden border border-[#caa14e]/40 md:block"
        }
      />
      <div
        className={
          imageOnly
            ? "hidden"
            : "absolute inset-0 hidden items-center px-6 text-white md:flex md:px-8"
        }
      >
        <div
          className={`${promo?.contentPosition === "right" ? "ml-auto text-left" : promo?.contentPosition === "center" ? "mx-auto text-center" : "text-left"} ${promo?.fontFamily === "sans" ? "" : "font-serif"}`}
          style={{ color: promo?.textColor ?? "#ffffff" }}
        >
          <h2 className={`uppercase leading-tight ${catalogTitleSize(promo?.fontSize)}`}>
            {promo?.title ?? "Crafted with Heritage, Worn with Pride."}
          </h2>
          <p className={`mt-2 text-current opacity-80 ${catalogCopySize(promo?.copyFontSize)}`}>
            {promo?.copy ?? "Explore our handpicked premium collection."}
          </p>
          <span className="relative mt-4 inline-flex h-10 items-center gap-2 border border-[#caa14e] bg-[#6e1423] px-5 text-xs font-semibold uppercase tracking-[0.1em] text-white transition-colors group-hover:bg-[#84182c]">
            {promo?.primaryCta?.label ?? "Explore Collection"}{" "}
            <Search aria-hidden="true" size={14} />
          </span>
        </div>
      </div>
    </a>
  );
}

/* ---------- Royal ornamental helper (presentational only) ---------- */

function CornerFiligree({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="30"
      stroke="currentColor"
      strokeWidth="1"
      viewBox="0 0 34 34"
      width="30"
    >
      <path d="M1 12C1 6 6 1 12 1" />
      <path d="M1 20c6 0 11-5 11-11" />
      <circle cx="12" cy="12" fill="currentColor" r="1.6" stroke="none" />
    </svg>
  );
}
