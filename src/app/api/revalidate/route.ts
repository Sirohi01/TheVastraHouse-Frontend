import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { PUBLIC_DATA_TAG } from "@/lib/cacheTags";

/**
 * Called by the API after an admin change (STOREFRONT_REVALIDATE_URL there) so cached public data
 * (CMS, pages, SEO settings, catalog home, redirects, sitemaps) is refetched on the next render
 * instead of waiting for its revalidate window. Disabled unless REVALIDATE_SECRET is set.
 */
export const dynamic = "force-dynamic";

export function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const provided = request.headers.get("x-revalidate-secret") ?? "";

  if (!secret || secret.length < 24 || !safeEqual(provided, secret)) {
    return new Response(null, { status: 401 });
  }

  revalidateTag(PUBLIC_DATA_TAG);
  return Response.json({ revalidated: true });
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
