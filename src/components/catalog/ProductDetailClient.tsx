"use client";

import { CheckCircle2, ChevronDown, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { NotifyMeForm } from "@/components/catalog/NotifyMeForm";
import { trackViewItem } from "@/lib/analytics";
import { AddToCartButton } from "@/components/commerce/AddToCartButton";
import { ProductCard } from "@/components/catalog/ProductCard";
import { RecentlyViewed } from "@/components/catalog/RecentlyViewed";
import { ReviewForm } from "@/components/catalog/ReviewForm";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import {
  getProductMedia,
  getProductPricing,
  type CatalogProduct,
  type MediaReference,
  type PdpResponse,
  type ProductReview,
  type ReviewSummary,
} from "@/lib/catalog";

export function ProductDetailClient({
  pdp,
  reviewSummary,
  reviews,
}: Readonly<{ pdp: PdpResponse; reviewSummary?: ReviewSummary; reviews: ProductReview[] }>) {
  const [selectedMedia, setSelectedMedia] = useState(0);
  const product = pdp.product;
  const activeVariants = product.variants.filter((item) => item.active !== false);
  const [selectedVariant, setSelectedVariant] = useState(() => {
    // Default to the first variant that can actually be bought.
    const index = product.variants.findIndex((item) => item.active !== false && item.availability?.canPurchase);
    return index >= 0 ? index : 0;
  });
  const media = getProductMedia(product);
  const variant = product.variants[selectedVariant] ?? activeVariants[0] ?? product.variants[0];
  // Availability comes from the inventory ledger via the API — the same source checkout uses.
  const canPreOrder = Boolean(variant?.availability?.canPreOrder) && !variant?.availability?.canPurchase;
  const canDirectOrder = Boolean(variant?.availability?.canPurchase);
  const lowStock = variant?.availability?.status === "low_stock";
  const pricing = getProductPricing({ ...product, variants: [variant] });

  useEffect(() => {
    if (!variant) return;
    trackViewItem({
      item_category: product.categoryIds?.[0]?.name,
      item_id: variant.sku ?? product._id,
      item_name: product.name,
      item_variant: [variant.color, variant.size].filter(Boolean).join(" / ") || undefined,
      price: variant.tierPrice ?? variant.salePrice ?? variant.basePrice,
    });
  }, [product, variant]);
  const storedProduct = {
    imageUrl: media[0]?.url,
    name: product.name,
    price: pricing.price,
    slug: product.slug,
  };

  return (
    <div className="bg-[#fbf7ef]">
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[minmax(280px,0.72fr)_minmax(360px,1.28fr)]">
        <div className="mx-auto w-full max-w-md lg:max-w-none">
          {media[selectedMedia]?.url ? (
            <div className="relative">
              <ProductMediaFrame
                alt={media[selectedMedia].altText ?? product.name}
                media={media[selectedMedia]}
                priority
              />
              <span className="pointer-events-none absolute inset-3 border border-[#caa14e]/35" />
              <CornerFiligree className="pointer-events-none absolute left-2 top-2 text-[#caa14e]/75" />
              <CornerFiligree className="pointer-events-none absolute right-2 top-2 rotate-90 text-[#caa14e]/75" />
              <CornerFiligree className="pointer-events-none absolute bottom-2 right-2 rotate-180 text-[#caa14e]/75" />
              <CornerFiligree className="pointer-events-none absolute bottom-2 left-2 -rotate-90 text-[#caa14e]/75" />
            </div>
          ) : (
            <div className="grid aspect-[9/16] place-items-center rounded-sm bg-muted text-muted-foreground">
              {product.name}
            </div>
          )}
          {media.length > 1 ? (
            <div className="mt-3 grid grid-cols-5 gap-3">
              {media.map((item, index) => (
                <button
                  className={`rounded-sm border p-1 transition-colors ${index === selectedMedia ? "border-[#6e1423] shadow-[0_0_0_3px_rgba(202,161,78,0.18)]" : "border-[#e1d6c4] hover:border-[#caa14e]"}`}
                  key={`${item.url}-${index}`}
                  onClick={() => setSelectedMedia(index)}
                  type="button"
                >
                  <ProductMediaFrame alt={item.altText ?? product.name} media={item} thumbnail />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-sm border border-[#e1d6c4] bg-[#fffdf8] shadow-[0_22px_56px_-44px_rgba(46,12,18,0.55)]">
          <div className="h-[3px] bg-[linear-gradient(90deg,#6e1423,#caa14e,#6e1423)]" />
          <div className="p-6">
            <div className="flex flex-wrap gap-2">
              {pricing.hasSale ? (
                <span className="rounded-sm border border-[#f0d9a4]/50 bg-[#6e1423] px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  Sale
                </span>
              ) : null}
              {Object.entries(pdp.badges ?? product.computedBadges ?? {})
                .filter(([, value]) => value)
                .map(([badge]) => (
                  <span
                    className="rounded-sm border border-[#caa14e]/40 bg-[#efe4d4] px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[#6e1423]"
                    key={badge}
                  >
                    {badge.replace(/[A-Z]/g, (letter) => ` ${letter}`)}
                  </span>
                ))}
            </div>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-[#3d1620]">
              {product.name}
            </h1>
            <FiligreeDivider align="start" className="mt-3" />
            {reviewSummary?.count ? (
              <a className="mt-3 inline-flex items-center gap-1 text-sm text-[#6e1423] hover:underline" href="#reviews">
                <Star aria-hidden="true" className="fill-[#caa14e] text-[#caa14e]" size={16} />
                <span className="font-semibold">{reviewSummary.average.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({reviewSummary.count} review{reviewSummary.count === 1 ? "" : "s"})
                </span>
              </a>
            ) : null}
            {product.shortDescription ? (
              <p className="mt-3 leading-7 text-muted-foreground">{product.shortDescription}</p>
            ) : null}
            <div className="mt-5 flex flex-wrap items-end gap-3">
              <p className="text-2xl font-semibold text-[#3d2a18]">
                {variant?.tierPrice !== undefined
                  ? new Intl.NumberFormat("en-IN", { currency: "INR", maximumFractionDigits: 0, style: "currency" }).format(variant.tierPrice)
                  : pricing.price}
              </p>
              {variant?.tierPrice !== undefined ? (
                <p className="pb-1 text-sm font-semibold uppercase text-[#6e1423]">
                  Trade price{product.wholesaleMinQuantity ? ` · MOQ ${product.wholesaleMinQuantity}` : ""}
                </p>
              ) : null}
              {pricing.hasSale && variant?.tierPrice === undefined ? (
                <>
                  <p className="pb-0.5 text-base text-muted-foreground line-through">
                    {pricing.original}
                  </p>
                  <p className="pb-1 text-sm font-semibold uppercase text-[#6e1423]">
                    {pricing.discountPercent}% Off
                  </p>
                </>
              ) : null}
            </div>
            {variant?.preOrder?.enabled ? <PreOrderPanel variant={variant} /> : null}

            <div className="mt-6 grid gap-4">
              <VariantSelector
                label="Color"
                options={[...new Set(product.variants.map((item) => item.color).filter(isString))]}
                selected={variant?.color}
                onSelect={(value) => selectVariant(product, setSelectedVariant, "color", value, variant?.size)}
              />
              <VariantSelector
                label="Size"
                options={[...new Set(product.variants.map((item) => item.size).filter(isString))]}
                selected={variant?.size}
                disabledOptions={product.variants
                  .filter((item) => item.color === variant?.color && item.availability?.status === "out_of_stock")
                  .map((item) => item.size)
                  .filter(isString)}
                onSelect={(value) => selectVariant(product, setSelectedVariant, "size", value, variant?.color)}
              />
            </div>

            {!canPreOrder && !canDirectOrder && variant ? (
              <div className="mt-6 rounded-md border border-[#e1d6c4] bg-white p-3">
                <p className="text-sm font-semibold text-[#3d1620]">Out of stock</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  This size/colour is sold out. Leave your email and we will tell you when it is back.
                </p>
                <NotifyMeForm productId={product._id} variantId={String(variant._id)} />
              </div>
            ) : null}
            {canDirectOrder && lowStock ? (
              <p className="mt-4 text-sm font-semibold text-[#6e1423]" role="status">
                Only {variant?.availability?.available} left in this size
              </p>
            ) : null}

            <div
              className={
                canDirectOrder
                  ? "mt-6 grid grid-cols-2 gap-3 sm:inline-grid"
                  : "mt-6 flex flex-wrap gap-3"
              }
            >
              {canPreOrder ? (
                <AddToCartButton
                  label="Pre-order"
                  productId={product._id}
                  purchaseMode="pre_order"
                  variantId={String(variant?._id)}
                />
              ) : canDirectOrder ? (
                <>
                  <AddToCartButton
                    className="w-full min-w-0 px-3 sm:min-w-40 sm:px-5"
                    productId={product._id}
                    purchaseMode="regular"
                    variantId={String(variant?._id)}
                  />
                  <AddToCartButton
                    afterAddPath="/checkout"
                    appearance="secondary"
                    className="w-full min-w-0 px-3 sm:min-w-40 sm:px-5"
                    label="Buy Now"
                    productId={product._id}
                    purchaseMode="regular"
                    variantId={String(variant?._id)}
                  />
                </>
              ) : (
                <button
                  className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-md border border-[#e1d6c4] px-5 text-sm font-semibold text-muted-foreground"
                  disabled
                  type="button"
                >
                  Out of stock
                </button>
              )}
            </div>
            {canPreOrder ? (
              <AvailabilityStrip
                label="Pre-order booking"
                value="Reserve now, production tracker included"
              />
            ) : canDirectOrder ? (
              <AvailabilityStrip label="Ready stock" value="Direct checkout available" />
            ) : null}

            <div className="mt-8 divide-y divide-[#e1d6c4] rounded-sm border border-[#e1d6c4] bg-white">
              <DetailSection title="Highlights">
                <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground marker:text-[#caa14e]">
                  {(product.highlights?.length
                    ? product.highlights
                    : ["Designed for everyday festive dressing."]
                  ).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </DetailSection>
              <DetailSection title="Fabric Details">
                {product.fabricDetails ??
                  "Fabric details will appear once the product team publishes them."}
              </DetailSection>
              <DetailSection title="Wash Care">
                {product.washCare ?? "Gentle wash recommended. Follow garment label instructions."}
              </DetailSection>
              <DetailSection title="Size Guide">
                <div className="grid gap-3">
                  <p>
                    {product.sizeGuide ??
                      "Use your usual size. Detailed measurements will appear from the catalog backend."}
                  </p>
                  {product.sizeGuideMedia?.url ? (
                    <ResponsiveImage
                      alt={product.sizeGuideMedia.altText ?? `${product.name} size guide`}
                      aspectRatio={product.sizeGuideMedia.aspectRatio ?? "16 / 9"}
                      className="rounded-sm border border-[#e1d6c4]"
                      objectFit={product.sizeGuideMedia.objectFit}
                      src={product.sizeGuideMedia.url}
                    />
                  ) : null}
                </div>
              </DetailSection>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 pb-10">
        <MerchandisingSection
          title="Related Products"
          products={pdp.merchandising.relatedProducts}
        />
        <MerchandisingSection
          title="Recommended"
          products={pdp.merchandising.recommendedProducts}
        />
        <MerchandisingSection
          title="Frequently Bought Together"
          products={pdp.merchandising.frequentlyBoughtTogether}
        />
        <MerchandisingSection
          title="Complete The Look"
          products={pdp.merchandising.completeTheLook}
        />
        <ReviewsSection product={product} reviews={reviews} summary={reviewSummary} />
        <RecentlyViewed product={storedProduct} />
      </div>
    </div>
  );
}

function PreOrderPanel({
  variant,
}: Readonly<{
  variant: CatalogProduct["variants"][number];
}>) {
  const preOrder = variant.preOrder;

  if (!preOrder?.enabled) {
    return null;
  }

  return (
    <div className="mt-5 rounded-lg border border-[#caa14e]/45 bg-[#fdf6e8] p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-[#6e1423]">
        <span aria-hidden="true" className="text-[#caa14e]">
          ❖
        </span>
        Pre-order active
      </p>
      <div className="mt-3 grid gap-2 text-sm text-[#6f6256] sm:grid-cols-2">
        <p>Booking closes: {formatDate(preOrder.endAt)}</p>
        <p>Remaining: {preOrder.remainingQuantity ?? 0}</p>
        <p>Dispatch: {formatDate(preOrder.expectedDispatchAt)}</p>
        <p>Delivery: {formatDate(preOrder.expectedDeliveryAt)}</p>
        <p className="sm:col-span-2">
          Payment: full amount online, or 50% Razorpay advance with COD
        </p>
      </div>
    </div>
  );
}

function ProductMediaFrame({
  alt,
  media,
  priority = false,
  thumbnail = false,
}: Readonly<{
  alt: string;
  media: MediaReference;
  priority?: boolean;
  thumbnail?: boolean;
}>) {
  if (media.type === "video") {
    return (
      <div className="relative grid aspect-[9/16] place-items-center overflow-hidden rounded-sm border border-[#e1d6c4] bg-black">
        <video
          aria-label={alt}
          className="size-full object-cover"
          controls={!thumbnail}
          muted={thumbnail}
          playsInline
          preload="metadata"
          src={media.url}
        />
        {thumbnail ? (
          <span className="absolute bottom-2 left-2 rounded-sm bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase text-white">
            Video
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <ResponsiveImage
      alt={alt}
      aspectRatio="9 / 16"
      className="rounded-sm border border-[#e1d6c4]"
      objectFit={media.objectFit}
      priority={priority}
      sizes={thumbnail ? "20vw" : "(max-width: 1024px) 100vw, 55vw"}
      src={media.url}
    />
  );
}

function VariantSelector({
  disabledOptions = [],
  label,
  onSelect,
  options,
  selected,
}: Readonly<{
  disabledOptions?: string[];
  label: string;
  onSelect: (value: string) => void;
  options: string[];
  selected?: string;
}>) {
  if (!options.length) {
    return null;
  }

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-[#3d1620]" id={`variant-${label}`}>
        {label}
      </p>
      <div aria-labelledby={`variant-${label}`} className="mt-2 flex flex-wrap gap-2" role="radiogroup">
        {options.map((option) => (
          <button
            aria-checked={selected === option}
            className={`h-10 rounded-md border px-4 text-sm font-semibold transition-colors ${
              selected === option
                ? "border-[#6e1423] bg-[#6e1423] text-white shadow-[0_6px_16px_-8px_rgba(110,20,35,0.7)]"
                : disabledOptions.includes(option)
                  ? "border-dashed border-[#e1d6c4] bg-white text-muted-foreground line-through"
                  : "border-[#e1d6c4] bg-white text-[#3d1620] hover:border-[#caa14e]"
            }`}
            key={option}
            onClick={() => onSelect(option)}
            role="radio"
            title={disabledOptions.includes(option) ? `${option} — out of stock` : undefined}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function AvailabilityStrip({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="mt-3 inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
      <CheckCircle2 aria-hidden="true" className="shrink-0" size={16} />
      <span className="font-semibold">{label}</span>
      <span className="text-emerald-700">{value}</span>
    </div>
  );
}

function DetailSection({
  children,
  title,
}: Readonly<{ children: React.ReactNode; title: string }>) {
  return (
    <details className="group p-4" open={title === "Highlights"}>
      <summary className="flex cursor-pointer list-none items-center justify-between font-serif font-semibold uppercase tracking-wide text-[#3d1620]">
        {title}
        <ChevronDown className="text-[#9b6d35] transition group-open:rotate-180" size={18} />
      </summary>
      <div className="mt-3 text-sm leading-6 text-muted-foreground">{children}</div>
    </details>
  );
}

function MerchandisingSection({
  products,
  title,
}: Readonly<{ products: CatalogProduct[]; title: string }>) {
  if (!products.length) {
    return null;
  }

  return (
    <section className="mt-12 border-t border-[#e1d6c4] pt-8">
      <SectionHeading title={title} />
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}

function ReviewsSection({
  product,
  reviews,
  summary,
}: Readonly<{ product: CatalogProduct; reviews: ProductReview[]; summary?: ReviewSummary }>) {
  return (
    <section className="mt-12 scroll-mt-24 border-t border-[#e1d6c4] pt-8" id="reviews">
      <SectionHeading title="Reviews & Ratings" />
      {summary?.count ? (
        <div className="mt-4 flex flex-wrap items-center gap-6 rounded-lg border border-[#e5dac7] bg-white p-4">
          <div>
            <p className="font-serif text-4xl text-[#3d1620]">{summary.average.toFixed(1)}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {summary.count} verified review{summary.count === 1 ? "" : "s"}
            </p>
          </div>
          <ul className="grid flex-1 gap-1 text-xs text-muted-foreground">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[String(star)] ?? 0;
              return (
                <li className="flex items-center gap-2" key={star}>
                  <span className="w-6">{star}★</span>
                  <span className="h-2 flex-1 overflow-hidden rounded bg-[#efe4d4]">
                    <span className="block h-full bg-[#caa14e]" style={{ width: `${(count / summary.count) * 100}%` }} />
                  </span>
                  <span className="w-6 text-right">{count}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {reviews.length ? (
          reviews.map((review) => (
            <article
              className="rounded-lg border border-[#e5dac7] bg-[#fffaf1] p-4"
              key={review._id}
            >
              <p className="font-semibold text-[#3d1620]">
                <span aria-label={`${review.rating} out of 5 stars`} className="text-[#caa14e]">
                  {"★".repeat(review.rating)}
                </span>{" "}
                {review.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.body}</p>
              {review.photos?.length ? (
                <div className="mt-3 flex gap-2">
                  {review.photos.map((photo) => (
                    <img
                      alt={photo.altText ?? "Customer photo"}
                      className="size-16 rounded-md border border-[#e5dac7] object-cover"
                      height={64}
                      key={photo.url}
                      loading="lazy"
                      src={photo.url}
                      width={64}
                    />
                  ))}
                </div>
              ) : null}
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#9b6d35]">
                {review.guestName ?? "Customer"}
                {review.verifiedPurchase ? " · Verified purchase" : ""}
              </p>
            </article>
          ))
        ) : (
          <p className="rounded-lg border border-[#e5dac7] bg-[#fffaf1] p-4 text-sm text-muted-foreground">
            Approved reviews will appear here after moderation.
          </p>
        )}
      </div>
      <ReviewForm slug={product.slug} />
    </section>
  );
}

/** Picks the variant matching the new choice while keeping the other attribute if possible. */
function selectVariant(
  product: CatalogProduct,
  setSelectedVariant: (value: number) => void,
  key: "color" | "size",
  value: string,
  otherValue?: string,
) {
  const other = key === "color" ? "size" : "color";
  const candidates = product.variants
    .map((variant, index) => ({ index, variant }))
    .filter(({ variant }) => variant.active !== false && variant[key] === value);
  const match =
    candidates.find(({ variant }) => variant[other] === otherValue && variant.availability?.canPurchase) ??
    candidates.find(({ variant }) => variant[other] === otherValue) ??
    candidates.find(({ variant }) => variant.availability?.canPurchase) ??
    candidates[0];

  if (match) {
    setSelectedVariant(match.index);
  }
}

function isString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

function formatDate(value?: string) {
  return value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        timeZone: "UTC",
        year: "numeric",
      }).format(new Date(value))
    : "-";
}

/* ---------- Royal ornamental helpers (presentational only) ---------- */

function SectionHeading({ title }: Readonly<{ title: string }>) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="text-[#caa14e]">
        ❖
      </span>
      <h2 className="font-serif text-2xl uppercase tracking-wide text-[#3d1620]">{title}</h2>
      <span className="h-px flex-1 bg-[linear-gradient(90deg,#caa14e,transparent)]" />
    </div>
  );
}

function FiligreeDivider({
  align = "center",
  className = "",
}: Readonly<{ align?: "center" | "start"; className?: string }>) {
  return (
    <div
      className={`flex items-center gap-2 text-[#caa14e] ${align === "center" ? "justify-center" : "justify-start"} ${className}`}
    >
      <span className="h-px w-10 bg-[linear-gradient(90deg,transparent,#caa14e)]" />
      <svg aria-hidden="true" height="14" viewBox="0 0 56 14" width="56">
        <path
          d="M2 7c8-6 14-6 18 0-4 6-10 6-18 0Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle cx="28" cy="7" fill="#6e1423" r="2.4" />
        <path
          d="M54 7c-8-6-14-6-18 0 4 6 10 6 18 0Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      <span className="h-px w-10 bg-[linear-gradient(90deg,#caa14e,transparent)]" />
    </div>
  );
}

function CornerFiligree({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="28"
      stroke="currentColor"
      strokeWidth="1"
      viewBox="0 0 34 34"
      width="28"
    >
      <path d="M1 12C1 6 6 1 12 1" />
      <path d="M1 20c6 0 11-5 11-11" />
      <circle cx="12" cy="12" fill="currentColor" r="1.6" stroke="none" />
    </svg>
  );
}
