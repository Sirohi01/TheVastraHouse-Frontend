"use client";

import { Ruler, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import type { MediaReference } from "@/lib/catalog";

export function SizeChartButton({
  className = "",
  productName,
  sizeGuide,
  sizeGuideMedia,
}: Readonly<{
  className?: string;
  productName: string;
  sizeGuide?: string;
  sizeGuideMedia?: MediaReference;
}>) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const modal = open ? (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-[#2e0c12]/55 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setOpen(false);
        }
      }}
      role="dialog"
    >
      <div className="relative flex max-h-[calc(100vh-48px)] w-full max-w-md flex-col overflow-hidden rounded-sm border border-[#caa14e]/70 bg-[#fffaf1] shadow-[0_28px_80px_-34px_rgba(46,12,18,0.9)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#e1d6c4] px-5 py-4">
          <h2 className="font-serif text-lg text-[#3d1620]">Size Chart — {productName}</h2>
          <button
            aria-label="Close size chart"
            className="grid size-8 shrink-0 place-items-center rounded-full border border-[#e1d6c4] text-[#6e1423] transition-colors hover:bg-[#6e1423] hover:text-white"
            onClick={() => setOpen(false)}
            type="button"
          >
            <X aria-hidden="true" size={15} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          {sizeGuideMedia?.url ? (
            <ResponsiveImage
              alt={sizeGuideMedia.altText ?? `${productName} size chart`}
              aspectRatio={sizeGuideMedia.aspectRatio ?? "3 / 4"}
              className="rounded-sm border border-[#e1d6c4]"
              objectFit={sizeGuideMedia.objectFit}
              src={sizeGuideMedia.url}
            />
          ) : null}
          {sizeGuide ? (
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[#6f6256]">{sizeGuide}</p>
          ) : null}
          {!sizeGuideMedia?.url && !sizeGuide ? (
            <p className="text-sm leading-6 text-[#6f6256]">
              A detailed size chart for this product isn&apos;t uploaded yet. For help picking your
              size, message us on{" "}
              <a
                className="font-semibold text-[#6e1423] underline-offset-2 hover:underline"
                href="https://wa.me/918868979485"
                rel="noreferrer"
                target="_blank"
              >
                WhatsApp
              </a>{" "}
              or email{" "}
              <a
                className="font-semibold text-[#6e1423] underline-offset-2 hover:underline"
                href="mailto:hello@thevastrahouse.com"
              >
                hello@thevastrahouse.com
              </a>
              .
            </p>
          ) : null}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-sm border border-[#e1d6c4] bg-white px-2 text-xs font-semibold uppercase tracking-wide text-[#3d1620] transition-colors hover:border-[#caa14e] hover:text-[#6e1423] ${className}`}
        onClick={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
        type="button"
      >
        <Ruler aria-hidden="true" size={14} />
        Size Chart
      </button>

      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
