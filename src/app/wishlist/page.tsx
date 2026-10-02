import type { Metadata } from "next";
import { WishlistClient } from "@/components/commerce/WishlistClient";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { privatePageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { ...privatePageMetadata, title: "Wishlist" };

export default function WishlistPage() {
  return (
    <PublicPageFrame
      eyebrow="Saved"
      title="Wishlist"
      description="Saved products show stock and price-change signals from the catalog backend."
    >
      <WishlistClient />
    </PublicPageFrame>
  );
}
