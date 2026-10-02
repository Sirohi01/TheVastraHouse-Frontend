import type { Metadata } from "next";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...privatePageMetadata,
  title: { default: "Admin", template: "%s | Admin" },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
