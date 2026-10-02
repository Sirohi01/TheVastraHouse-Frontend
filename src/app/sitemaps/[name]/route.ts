import { renderChildSitemap } from "@/lib/sitemap";

export const revalidate = 300;

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  const xml = await renderChildSitemap(name.replace(/\.xml$/, ""));

  if (!xml) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(xml, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
