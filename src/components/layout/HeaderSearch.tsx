"use client";

import { Loader2, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { apiBaseUrl } from "@/lib/api";
import type { MediaReference } from "@/lib/catalog";

type SearchResult = {
  _id: string;
  href: string;
  image?: MediaReference;
  kind: "Category" | "Collection" | "Product" | "Tag";
  title: string;
};

/** Header search: opens a panel with live suggestions; Enter / "View all" goes to /shop?q=. */
export function HeaderSearch({ className = "" }: Readonly<{ className?: string }>) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const trimmed = query.trim();

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(trimmed), 300);
    return () => window.clearTimeout(timeout);
  }, [trimmed]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      setError("");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetch(`${apiBaseUrl}/catalog/search?q=${encodeURIComponent(debounced)}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Search failed. Please try again.");
        return response.json() as Promise<{ results: SearchResult[] }>;
      })
      .then((payload) => setResults(payload.results))
      .catch((searchError: unknown) => {
        if (controller.signal.aborted) return;
        setResults([]);
        setError(searchError instanceof Error ? searchError.message : "Search failed");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debounced]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!trimmed) return;
    window.location.assign(`/shop?q=${encodeURIComponent(trimmed)}`);
  }

  const showPanel = trimmed.length >= 2;

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Search"
        className={className}
        onClick={() => setOpen(true)}
        ref={triggerRef}
        title="Search"
        type="button"
      >
        <Search aria-hidden="true" size={18} strokeWidth={1.5} />
      </button>

      {mounted && open
        ? createPortal(
            <div
              aria-label="Search products"
              aria-modal="true"
              className="fixed inset-0 z-[100] bg-[#2e0c12]/55 backdrop-blur-[2px]"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setOpen(false);
              }}
              role="dialog"
            >
              <div className="mx-auto mt-0 w-full max-w-2xl bg-[#fffaf1] shadow-[0_30px_80px_-30px_rgba(46,12,18,0.8)] md:mt-16 md:rounded-sm md:border md:border-[#e1d6c4]">
                <form
                  className="flex items-center gap-3 border-b border-[#e1d6c4] px-4"
                  onSubmit={submit}
                >
                  <Search aria-hidden="true" className="shrink-0 text-[#9b6d35]" size={18} />
                  <input
                    autoComplete="off"
                    className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#a99a86]"
                    enterKeyHint="search"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search products, categories, collections..."
                    ref={inputRef}
                    type="search"
                    value={query}
                  />
                  {loading ? (
                    <Loader2
                      aria-hidden="true"
                      className="shrink-0 animate-spin text-[#9b6d35]"
                      size={17}
                    />
                  ) : null}
                  <button
                    aria-label="Close search"
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[#3b3128] transition hover:bg-[#f1e6d3]"
                    onClick={() => {
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                    type="button"
                  >
                    <X aria-hidden="true" size={18} />
                  </button>
                </form>

                {showPanel ? (
                  <div className="max-h-[70vh] overflow-y-auto">
                    {error ? (
                      <p className="p-4 text-sm text-destructive">{error}</p>
                    ) : results.length ? (
                      <>
                        {results.map((item) => (
                          <a
                            className="grid grid-cols-[48px_1fr] items-center gap-3 border-b border-[#efe5d6] p-3 transition hover:bg-[#f6ecda]/60"
                            href={item.href}
                            key={`${item.kind}-${item._id}`}
                          >
                            {item.image?.url ? (
                              <ResponsiveImage
                                alt={item.image.altText ?? item.title}
                                aspectRatio="1 / 1"
                                className="rounded-sm"
                                objectFit={item.image.objectFit ?? "cover"}
                                sizes="48px"
                                src={item.image.url}
                              />
                            ) : (
                              <span className="grid aspect-square place-items-center rounded-sm bg-[#fbf7ef] text-xs font-semibold text-[#9b6d35]">
                                {item.kind.slice(0, 1)}
                              </span>
                            )}
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-[#2f1c12]">
                                {item.title}
                              </span>
                              <span className="mt-0.5 inline-flex rounded-sm bg-[#fbf7ef] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9b6d35]">
                                {item.kind}
                              </span>
                            </span>
                          </a>
                        ))}
                        <a
                          className="block bg-[#6e1423] px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-white"
                          href={`/shop?q=${encodeURIComponent(trimmed)}`}
                          style={{ color: "#ffffff" }}
                        >
                          View all results for “{trimmed}”
                        </a>
                      </>
                    ) : loading || debounced !== trimmed ? (
                      <p className="p-4 text-sm text-muted-foreground">Searching...</p>
                    ) : (
                      <p className="p-4 text-sm text-muted-foreground">
                        No results for “{trimmed}”. Press Enter to search the shop.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="p-4 text-xs text-muted-foreground">
                    Type at least 2 letters to search.
                  </p>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
