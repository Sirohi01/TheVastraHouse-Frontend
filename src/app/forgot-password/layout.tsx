import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = { ...privatePageMetadata, title: "Forgot Password" };

export default function ForgotPasswordLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
