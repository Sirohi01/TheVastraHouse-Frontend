import type { Metadata } from "next";
import { CustomerReturnsClient } from "@/components/returns/CustomerReturnsClient";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = { ...privatePageMetadata, title: "Returns" };

export default function ReturnsPage() {
  return <CustomerReturnsClient />;
}
