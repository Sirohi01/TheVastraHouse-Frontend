import type { Metadata } from "next";
import { Suspense } from "react";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = { ...privatePageMetadata, title: "Verify Email" };

export default function VerifyEmailLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Client pages here read useSearchParams(); a boundary keeps them prerenderable.
  return <Suspense>{children}</Suspense>;
}
