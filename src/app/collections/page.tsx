import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getCatalogHome, type CatalogTile } from "@/lib/catalog";
import { buildPageMetadata, getSeoSettings } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSeoSettings();
  return buildPageMetadata(settings, {
    description: "Browse every collection from The Vastra House.",
    name: "Collections",
    path: "/collections",
  });
}

export default async function CollectionsPage() {
  const collections = await loadCollections();

  return (
    <div className="bg-[#fbf7ef] text-[#211f1c]">
      <section className="mx-auto max-w-7xl px-5 py-10">
        <p className="text-center text-[11px] font-normal uppercase tracking-[0.3em] text-[#9b6d35]">
          The Vastra House
        </p>
        <h1 className="mt-2 text-center font-[family-name:var(--font-display)] text-4xl font-medium uppercase tracking-[0.06em] text-[#3d1620] md:text-5xl">
          Collections
        </h1>

        {collections.length ? (
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {collections.map((collection) => (
              <a
                className="group relative block overflow-hidden rounded-sm"
                href={`/collections/${collection.slug}`}
                key={collection._id}
              >
                <div className="relative aspect-[4/5] bg-muted">
                  {collection.banner?.url ? (
                    <Image
                      alt={collection.banner.altText || collection.name}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      src={collection.banner.url}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(0deg,rgb(32_22_12/0.8),transparent_55%)]" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-center text-white">
                    <h2 className="font-[family-name:var(--font-display)] text-xl font-medium uppercase tracking-wide md:text-2xl">
                      {collection.name}
                    </h2>
                    <span className="mt-1 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#f0d9a4]">
                      Explore <ArrowRight aria-hidden="true" size={13} />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            New collections are coming soon.
          </p>
        )}
      </section>
    </div>
  );
}

async function loadCollections(): Promise<CatalogTile[]> {
  try {
    return (await getCatalogHome()).collections;
  } catch {
    return [];
  }
}
