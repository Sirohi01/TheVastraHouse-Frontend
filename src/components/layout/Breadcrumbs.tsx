import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo";

export type BreadcrumbItem = { name: string; path: string };

/**
 * Visible breadcrumb trail plus matching BreadcrumbList schema, so the two can never drift.
 * "Home" is prepended automatically.
 */
export function Breadcrumbs({ items }: Readonly<{ items: BreadcrumbItem[] }>) {
  const trail = [{ name: "Home", path: "/" }, ...items];

  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
      <nav aria-label="Breadcrumb" className="text-xs text-[#6f6256]">
        <ol className="flex flex-wrap items-center gap-1">
          {trail.map((item, index) => {
            const last = index === trail.length - 1;
            return (
              <li className="flex items-center gap-1" key={item.path}>
                {last ? (
                  <span aria-current="page" className="font-semibold text-[#3d1620]">
                    {item.name}
                  </span>
                ) : (
                  <Link className="hover:text-primary hover:underline" href={item.path}>
                    {item.name}
                  </Link>
                )}
                {last ? null : <span aria-hidden="true">/</span>}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
