import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = { ...privatePageMetadata, title: "Reset Password" };

export default function ResetPasswordLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
