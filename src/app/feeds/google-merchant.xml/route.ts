import { getProducts, type CatalogProduct, type ProductVariant } from "@/lib/catalog";
import { absoluteUrl, getSeoSettings } from "@/lib/seo";

export const revalidate = 900;
function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function plain(value: string | undefined, max: number) {
  const text = (value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function feedAvailability(variant: ProductVariant) {
  const status = variant.availability?.status;
  if (status === "in_stock" || status === "low_stock") return "in_stock";
  if (status === "pre_order") return "preorder";
  return "out_of_stock";
}

function money(value: number, currency: string) {
  return `${value.toFixed(2)} ${currency}`;
}

function itemXml(product: CatalogProduct, variant: ProductVariant, brand: string) {
  const link = absoluteUrl(`/shop/${product.slug}`);
  const media = (variant.media?.length ? variant.media : (product.media ?? [])).filter(
    (item) => item.type === "image",
  );
  const [main, ...extra] = media;
  const currency = variant.currencyCode ?? "INR";
  const hasSale =
    typeof variant.salePrice === "number" &&
    variant.salePrice > 0 &&
    variant.salePrice < variant.basePrice;
  const tags: Array<[string, string | undefined]> = [
    ["g:id", variant.sku ?? variant._id],
    ["g:item_group_id", product.slug],
    ["title", plain(`${product.name}${variant.size ? ` - ${variant.size}` : ""}`, 150)],
    ["description", plain(product.description ?? product.shortDescription ?? product.name, 5000)],
    ["link", link],
    ["g:image_link", main?.url],
    ["g:availability", feedAvailability(variant)],
    ["g:price", money(variant.basePrice, currency)],
    ["g:sale_price", hasSale ? money(variant.salePrice!, currency) : undefined],
    ["g:brand", brand],
    ["g:condition", "new"],
    ["g:identifier_exists", "no"],
    ["g:color", variant.color],
    ["g:size", variant.size],
    ["g:material", plain(product.fabricDetails, 200) || undefined],
    ["g:gender", "female"],
    ["g:age_group", "adult"],
    ["g:product_type", product.categoryIds?.[0]?.name],
  ];
  const body = tags
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([tag, value]) => `<${tag}>${escapeXml(value)}</${tag}>`)
    .join("");
  const additional = extra
    .slice(0, 10)
    .map((item) => `<g:additional_image_link>${escapeXml(item.url)}</g:additional_image_link>`)
    .join("");
  return `<item>${body}${additional}</item>`;
}

export async function GET() {
  const settings = await getSeoSettings();
  const products: CatalogProduct[] = [];

  for (let page = 1; page <= 20; page += 1) {
    const result = await getProducts({ limit: "100", page: String(page) }).catch(() => null);
    if (!result) break;
    products.push(...result.data);
    if (page >= (result.meta?.totalPages ?? 1)) break;
  }

  const items = products.flatMap((product) =>
    product.variants
      .filter((variant) => variant.active !== false)
      .map((variant) => itemXml(product, variant, settings.brandName)),
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>${escapeXml(settings.brandName)}</title><link>${escapeXml(absoluteUrl("/"))}</link><description>${escapeXml(settings.defaultDescription)}</description>${items.join("")}</channel></rss>`;

  return new Response(xml, {
    headers: {
      "Cache-Control": "public, max-age=900, s-maxage=900",
      "Content-Type": "application/xml; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}
