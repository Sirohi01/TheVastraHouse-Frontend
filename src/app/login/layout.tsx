import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = { ...privatePageMetadata, title: "Sign In" };

export default function SignInLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
