import { apiBaseUrl } from "@/lib/api";
import type { EntitySeo } from "@/lib/seo";

export type MediaReference = {
  mediaId?: string;
  url: string;
  altText?: string;
  type: "image" | "video" | "pdf" | "lookbook";
  aspectRatio?: string;
  objectFit?: "cover" | "contain";
};

export type VariantAvailability = {
  status: "in_stock" | "low_stock" | "out_of_stock" | "pre_order";
  available: number;
  canPurchase: boolean;
  canPreOrder: boolean;
};

export type ProductVariant = {
  _id: string;
  color?: string;
  size?: string;
  sku?: string;
  basePrice: number;
  salePrice?: number;
  /** Negotiated wholesale price for approved B2B buyers (server-resolved). */
  tierPrice?: number;
  priceListCode?: string;
  currencyCode?: string;
  /** Ledger-backed availability computed by the API. */
  availability?: VariantAvailability;
  active?: boolean;
  media?: MediaReference[];
  preOrder?: {
    advancePercent?: number;
    enabled?: boolean;
    endAt?: string;
    expectedDeliveryAt?: string;
    expectedDispatchAt?: string;
    paymentMode?: "full" | "advance";
    quantityCap?: number;
    remainingQuantity?: number;
    startAt?: string;
  };
};

export type SeoFields = EntitySeo;

export type ContentFaq = { question: string; answer: string };

export type TaxonomyRef = {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  seo?: SeoFields;
  banner?: MediaReference;
  introContent?: string;
  bottomContent?: string;
  faqs?: ContentFaq[];
  updatedAt?: string;
};

export type CatalogProduct = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  highlights?: string[];
  fabricDetails?: string;
  washCare?: string;
  sizeGuide?: string;
  sizeGuideMedia?: MediaReference;
  media?: MediaReference[];
  variants: ProductVariant[];
  categoryIds?: TaxonomyRef[];
  collectionIds?: TaxonomyRef[];
  tagIds?: TaxonomyRef[];
  computedBadges?: Record<string, boolean>;
  seo?: SeoFields;
  ratingAverage?: number;
  ratingCount?: number;
  availabilityStatus?: VariantAvailability["status"];
  wholesaleMinQuantity?: number;
  updatedAt?: string;
};

export type CatalogTile = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  banner?: MediaReference;
};

export type CatalogFilterOption = {
  _id: string;
  count: number;
  name: string;
  slug: string;
};

export type CatalogFilters = {
  categories: CatalogFilterOption[];
  collections: CatalogFilterOption[];
  colors: string[];
  fabrics: string[];
  price: {
    max: number;
    min: number;
  };
  sizes: string[];
  tags: CatalogFilterOption[];
};

export type ProductReview = {
  _id: string;
  rating: number;
  title?: string;
  body: string;
  guestName?: string;
  verifiedPurchase?: boolean;
  photos?: MediaReference[];
  createdAt?: string;
};

export type ReviewSummary = {
  average: number;
  count: number;
  distribution: Record<string, number>;
};

export type PaginatedResult<T> = {
  suggestion?: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type PdpResponse = {
  product: CatalogProduct;
  badges?: Record<string, boolean>;
  merchandising: {
    relatedProducts: CatalogProduct[];
    recommendedProducts: CatalogProduct[];
    frequentlyBoughtTogether: CatalogProduct[];
    completeTheLook: CatalogProduct[];
  };
};

export type CatalogQuery = {
  page?: string;
  limit?: string;
  search?: string;
  q?: string;
  size?: string;
  color?: string;
  fabric?: string;
  minPrice?: string;
  maxPrice?: string;
  collectionId?: string;
  tagId?: string;
  categoryId?: string;
  sort?: string;
  view?: string;
  preOrder?: string;
};

export const sortOptions = {
  sorts: [
    { label: "Newest", value: "-newest" },
    { label: "Price: Low to High", value: "price" },
    { label: "Price: High to Low", value: "-price" },
    { label: "Best Selling", value: "-bestSelling" },
    { label: "Name", value: "name" },
  ],
};

export async function getProducts(query: CatalogQuery = {}) {
  return catalogFetch<PaginatedResult<CatalogProduct>>(`/catalog/products${toQueryString(query)}`);
}

export async function getCatalogFilters() {
  return catalogFetch<CatalogFilters>("/catalog/filters");
}

export async function getCatalogHome() {
  const response = await fetch(`${apiBaseUrl}/catalog/home`, {
    next: { revalidate: 60, tags: ["catalog:home"] },
  });
  if (!response.ok) {
    throw new Error((await response.text()) || "Catalog home request failed");
  }
  return response.json() as Promise<{
    categories: CatalogTile[];
    collections: CatalogTile[];
    products: CatalogProduct[];
  }>;
}

export async function getProduct(slug: string) {
  return catalogFetch<{ product: CatalogProduct }>(`/catalog/products/${slug}`);
}

export async function getProductPdp(slug: string) {
  return catalogFetch<PdpResponse>(`/catalog/products/${slug}/pdp`);
}

export async function getProductReviews(slug: string, page = "1") {
  return catalogFetch<PaginatedResult<ProductReview> & { summary: ReviewSummary }>(
    `/catalog/products/${slug}/reviews${toQueryString({ page, limit: "8" })}`,
  );
}

export async function getCategory(slug: string) {
  return catalogFetch<{ category: TaxonomyRef }>(`/catalog/categories/${slug}`);
}

export async function getCollection(slug: string) {
  return catalogFetch<{ collection: TaxonomyRef }>(`/catalog/collections/${slug}`);
}

/** Authenticated: reviews are tied to a customer account (verified-purchase detection). */
export async function submitReview(slug: string, payload: Record<string, unknown>) {
  const { apiFetch } = await import("@/lib/api");
  return apiFetch<{ moderationStatus: "pending" }>(`/catalog/products/${slug}/reviews`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

/** Lowest price the viewer pays and whether any variant can be bought or pre-ordered. */
export function getProductAvailability(product: CatalogProduct) {
  const variants = product.variants.filter((variant) => variant.active !== false);
  const purchasable = variants.some((variant) => variant.availability?.canPurchase);
  const preorderable = variants.some((variant) => variant.availability?.canPreOrder);
  const lowStock = variants.some((variant) => variant.availability?.status === "low_stock");
  return {
    label: purchasable ? (lowStock ? "Only a few left" : "In stock") : preorderable ? "Pre-order" : "Out of stock",
    lowStock,
    preorderable,
    purchasable,
    status: product.availabilityStatus ?? (purchasable ? "in_stock" : preorderable ? "pre_order" : "out_of_stock"),
  };
}

export function getProductMedia(product: CatalogProduct) {
  return product.media?.length ? product.media : (product.variants[0]?.media ?? []);
}

export function getProductPrice(product: CatalogProduct) {
  const variant = product.variants[0];
  const price = variant?.salePrice ?? variant?.basePrice ?? 0;
  const currency = variant?.currencyCode ?? "INR";

  return formatMoney(price, currency);
}

export function getProductPricing(product: CatalogProduct) {
  const variant = product.variants[0];
  const basePrice = variant?.basePrice ?? 0;
  const salePrice = variant?.salePrice;
  const currency = variant?.currencyCode ?? "INR";
  const hasSale = typeof salePrice === "number" && salePrice > 0 && salePrice < basePrice;
  const discountPercent = hasSale ? Math.round(((basePrice - salePrice) / basePrice) * 100) : 0;

  return {
    basePrice,
    currency,
    discountPercent,
    hasSale,
    original: formatMoney(basePrice, currency),
    price: formatMoney(hasSale ? salePrice : basePrice, currency),
    salePrice: salePrice ?? basePrice,
  };
}

function formatMoney(price: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(price);
}

async function catalogFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, { next: { revalidate: 30 } });

  if (!response.ok) {
    throw new Error((await response.text()) || "Catalog request failed");
  }

  return response.json() as Promise<T>;
}

function toQueryString(query: CatalogQuery) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
    }
  }

  const value = params.toString();
  return value ? `?${value}` : "";
}
