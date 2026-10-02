import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = { ...privatePageMetadata, title: "Verify Code" };

export default function VerifyCodeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
