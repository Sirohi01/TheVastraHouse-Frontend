import type { Metadata } from "next";
import Link from "next/link";

// The root layout declares "index, follow"; this page overrides it so a 404 never carries a
// conflicting robots directive (Next.js also adds its own `noindex`, which agrees).
export const metadata: Metadata = {
  robots: { follow: false, googleBot: { follow: false, index: false }, index: false },
  title: "Page not found",
};

const links = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?sort=-newest", label: "New arrivals" },
  { href: "/pre-order", label: "Pre-order" },
  { href: "/blog", label: "Journal" },
  { href: "/contact", label: "Contact us" },
];

/** Rendered with a genuine HTTP 404 by notFound(). */
export default function NotFound() {
  return (
    <div className="bg-[#fbf7ef] px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#caa14e]">
          Error 404
        </p>
        <h1 className="mt-3 font-serif text-4xl uppercase text-[#3d1620]">
          This page could not be found
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#6f6256]">
          The link may be old or the item may no longer be available. Try one of these instead:
        </p>
        <nav aria-label="Helpful links" className="mt-8 flex flex-wrap justify-center gap-3">
          {links.map((link) => (
            <Link
              className="rounded-md border border-[#e5dac7] bg-white px-4 py-2 text-sm font-semibold text-[#3d1620] hover:border-primary"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <form action="/shop" className="mx-auto mt-8 flex max-w-md gap-2" role="search">
          <label className="sr-only" htmlFor="notfound-search">
            Search products
          </label>
          <input
            className="h-11 flex-1 rounded-md border border-border px-3 text-sm"
            id="notfound-search"
            name="q"
            placeholder="Search kurtas, sarees…"
            type="search"
          />
          <button
            className="h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            type="submit"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
