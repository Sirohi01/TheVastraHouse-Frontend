import type { Metadata } from "next";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { TrackOrderClient } from "@/components/orders/TrackOrderClient";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = { ...privatePageMetadata, title: "Track Your Order" };

export default function TrackOrderPage() {
  return (
    <PublicPageFrame
      eyebrow="Order Status"
      title="Track Order"
      description="View the latest order status, shipment details, items, and status timeline."
    >
      <TrackOrderClient />
    </PublicPageFrame>
  );
}
