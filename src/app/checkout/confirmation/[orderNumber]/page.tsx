import type { Metadata } from "next";
import { OrderConfirmationClient } from "@/components/checkout/OrderConfirmationClient";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { privatePageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { ...privatePageMetadata, title: "Order Confirmation" };

export default async function CheckoutConfirmationPage({
  params,
}: Readonly<{ params: Promise<{ orderNumber: string }> }>) {
  const { orderNumber } = await params;

  return (
    <PublicPageFrame
      eyebrow="Order Placed"
      title="Order Confirmation"
      description="Your order details, payment status, and next steps are shown below."
    >
      <OrderConfirmationClient orderNumber={orderNumber} />
    </PublicPageFrame>
  );
}
