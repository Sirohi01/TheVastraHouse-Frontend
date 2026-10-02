import type { Metadata } from "next";
import { CustomerDocumentsClient } from "@/components/documents/CustomerDocumentsClient";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = { ...privatePageMetadata, title: "Documents" };

export default function CustomerDocumentsPage() {
  return <CustomerDocumentsClient />;
}
