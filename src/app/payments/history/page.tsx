import type { Metadata } from "next";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { PaymentHistoryClient } from "@/components/payments/PaymentHistoryClient";
import { privatePageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { ...privatePageMetadata, title: "Payment History" };

export default function PaymentHistoryPage() {
  return (
    <PublicPageFrame
      eyebrow="Payments"
      title="Payment History"
      description="Customer-visible payment events by order reference."
    >
      <PaymentHistoryClient />
    </PublicPageFrame>
  );
}
