import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = { ...privatePageMetadata, title: "Create Account" };

export default function CreateAccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
