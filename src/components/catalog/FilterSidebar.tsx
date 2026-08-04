"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { CatalogFilters, CatalogQuery } from "@/lib/catalog";

export function FilterSidebar({
  filters,
  query,
}: Readonly<{ filters: CatalogFilters; query: CatalogQuery }>) {
  const [open, setOpen] = useState(false);

  return (
    <aside className="border-[#e1d6c4] bg-[#fffaf1] md:border-r">
      <form className="divide-y divide-[#e1d6c4]">
        <input name="search" type="hidden" value={query.search ?? ""} />
        <input name="sort" type="hidden" value={query.sort ?? "-newest"} />
        <input name="view" type="hidden" value={query.view ?? "grid"} />
        {query.preOrder ? <input name="preOrder" type="hidden" value={query.preOrder} /> : null}
        <div className="flex items-center justify-between bg-[#fdf6e8] px-5 py-4">
          <button
            className="flex items-center gap-2 font-serif text-sm font-semibold uppercase tracking-wide text-[#3d1620]"
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            <span aria-hidden="true" className="text-[#caa14e]">
              ❖
            </span>
            Filters
            <ChevronDown
              aria-hidden="true"
              className={`text-[#9b6d35] transition-transform duration-200 md:hidden ${open ? "rotate-180" : ""}`}
              size={16}
            />
          </button>
          <a
            className="text-xs font-semibold uppercase tracking-wide text-[#6e1423] underline-offset-2 hover:underline"
            href="/shop"
          >
            Clear All
          </a>
        </div>

        <div className={`${open ? "block" : "hidden"} divide-y divide-[#e1d6c4] md:block`}>
          <FilterGroup title="Category">
            {filters.categories.map((item) => (
              <Checkbox
                checked={query.categoryId === item._id}
                key={item._id}
                label={`${item.name} (${item.count})`}
                name="categoryId"
                value={item._id}
              />
            ))}
          </FilterGroup>
          {filters.collections.length ? (
            <FilterGroup title="Collection">
              {filters.collections.map((item) => (
                <Checkbox
                  checked={query.collectionId === item._id}
                  key={item._id}
                  label={`${item.name} (${item.count})`}
                  name="collectionId"
                  value={item._id}
                />
              ))}
            </FilterGroup>
          ) : null}
          <FilterGroup title="Price">
            <div className="grid grid-cols-2 gap-3">
              <input
                className="h-9 min-w-0 rounded-sm border border-[#e1d6c4] bg-white px-2 text-sm outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#caa14e] focus:shadow-[0_0_0_3px_rgba(202,161,78,0.16)]"
                defaultValue={query.minPrice}
                name="minPrice"
                placeholder={`Min ${filters.price.min}`}
              />
              <input
                className="h-9 min-w-0 rounded-sm border border-[#e1d6c4] bg-white px-2 text-sm outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#caa14e] focus:shadow-[0_0_0_3px_rgba(202,161,78,0.16)]"
                defaultValue={query.maxPrice}
                name="maxPrice"
                placeholder={`Max ${filters.price.max}`}
              />
            </div>
          </FilterGroup>
          <FilterGroup title="Size">
            <div className="flex flex-wrap gap-2">
              {filters.sizes.map((size) => (
                <label
                  className={`grid size-9 cursor-pointer place-items-center rounded-sm border text-xs font-semibold transition-colors ${
                    query.size === size
                      ? "border-[#6e1423] bg-[#6e1423] text-white shadow-[0_4px_12px_-6px_rgba(110,20,35,0.7)]"
                      : "border-[#e1d6c4] bg-white hover:border-[#caa14e]"
                  }`}
                  key={size}
                >
                  <input
                    className="sr-only"
                    defaultChecked={query.size === size}
                    name="size"
                    type="radio"
                    value={size}
                  />
                  {size}
                </label>
              ))}
            </div>
          </FilterGroup>
          <FilterGroup title="Color">
            <div className="flex flex-wrap gap-2.5">
              {filters.colors.map((color) => (
                <label
                  className={`grid size-7 cursor-pointer place-items-center rounded-full border-2 transition-colors ${
                    query.color === color
                      ? "border-[#6e1423]"
                      : "border-[#e1d6c4] hover:border-[#caa14e]"
                  }`}
                  key={color}
                  title={color}
                >
                  <input
                    className="sr-only"
                    defaultChecked={query.color === color}
                    name="color"
                    type="radio"
                    value={color}
                  />
                  <span
                    className="size-4 rounded-full ring-1 ring-black/5"
                    style={{ backgroundColor: colorToSwatch(color) }}
                  />
                </label>
              ))}
            </div>
          </FilterGroup>
          <FilterGroup title="Fabric">
            {filters.fabrics.map((item) => (
              <Checkbox
                checked={query.fabric === item}
                key={item}
                label={item}
                name="fabric"
                value={item}
              />
            ))}
          </FilterGroup>
          {filters.tags.length ? (
            <FilterGroup title="Tags">
              {filters.tags.map((item) => (
                <Checkbox
                  checked={query.tagId === item._id}
                  key={item._id}
                  label={`${item.name} (${item.count})`}
                  name="tagId"
                  value={item._id}
                />
              ))}
            </FilterGroup>
          ) : null}
          <div className="grid grid-cols-2 gap-3 p-5">
            <a
              className="grid h-10 place-items-center border border-[#6e1423] text-sm font-semibold uppercase tracking-wide text-[#6e1423] transition-colors hover:bg-[#6e1423] hover:text-white"
              href="/shop"
            >
              Reset
            </a>
            <button className="relative h-10 overflow-hidden bg-[#6e1423] text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#84182c]">
              <span className="pointer-events-none absolute left-1 top-1 size-1.5 border-l border-t border-[#f0d9a4]/70" />
              <span className="pointer-events-none absolute bottom-1 right-1 size-1.5 border-b border-r border-[#f0d9a4]/70" />
              Apply
            </button>
          </div>
        </div>
      </form>
    </aside>
  );
}

function FilterGroup({ children, title }: Readonly<{ children: React.ReactNode; title: string }>) {
  return (
    <details className="group px-5 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold uppercase tracking-wide text-[#3d1620]">
        {title}
        <ChevronDown
          aria-hidden="true"
          className="text-[#9b6d35] transition-transform duration-200 group-open:rotate-180"
          size={16}
        />
      </summary>
      <div className="mt-4 grid gap-3">{children}</div>
    </details>
  );
}

function Checkbox({
  checked = false,
  label,
  name = "category",
  value = label,
}: Readonly<{ checked?: boolean; label: string; name?: string; value?: string }>) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-[#6f6256] transition-colors hover:text-[#3d1620]">
      <input
        className="size-4 rounded-sm border-[#d8c8b1] accent-[#6e1423]"
        defaultChecked={checked}
        name={name}
        type="radio"
        value={value}
      />
      {label}
    </label>
  );
}

function colorToSwatch(color: string) {
  const map: Record<string, string> = {
    black: "#111111",
    cream: "#efe0c8",
    gold: "#c59a45",
    ivory: "#eee3cf",
    mint: "#9bbfac",
    mustard: "#b47a28",
    navy: "#15243b",
    pearl: "#f3ead9",
    rose: "#d59a9a",
    sage: "#909b73",
    wine: "#7e2432",
  };

  return map[color.toLowerCase()] ?? "#a88968";
}
