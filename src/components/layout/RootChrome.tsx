"use client";

import { usePathname } from "next/navigation";
import { Footer, type FooterPage } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import type { CmsContent } from "@/lib/cms";

export function RootChrome({
  children,
  cms,
  policyPages = [],
}: Readonly<{ children: React.ReactNode; cms: CmsContent; policyPages?: FooterPage[] }>) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return children;
  }

  return (
    <>
      <Header cms={cms} />
      <main id="content" tabIndex={-1}>
        {children}
      </main>
      <Footer cms={cms} pages={policyPages} />
    </>
  );
}
