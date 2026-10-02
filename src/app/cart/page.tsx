import type { Metadata } from "next";
import { CartClient } from "@/components/commerce/CartClient";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { privatePageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { ...privatePageMetadata, title: "Shopping Cart" };

export default function CartPage() {
  return (
    <PublicPageFrame
      eyebrow="Cart"
      title="Shopping Cart"
      description="Review line items, quantities, gift packaging, and gift card redemption before checkout."
    >
      <CartClient />
    </PublicPageFrame>
  );
}
