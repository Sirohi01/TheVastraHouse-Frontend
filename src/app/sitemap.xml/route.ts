import { renderIndex, sitemapIndexLocations } from "@/lib/sitemap";

export const revalidate = 300;

export async function GET() {
  return new Response(renderIndex(await sitemapIndexLocations()), {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=300", "Content-Type": "application/xml; charset=utf-8" },
  });
}
