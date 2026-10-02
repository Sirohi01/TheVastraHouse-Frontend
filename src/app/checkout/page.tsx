import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { privatePageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { ...privatePageMetadata, title: "Checkout" };

export default function CheckoutPage() {
  return (
    <PublicPageFrame
      eyebrow="Secure Checkout"
      title="Checkout"
      description="Address, shipping, payment, and order review."
    >
      <CheckoutClient />
    </PublicPageFrame>
  );
}
