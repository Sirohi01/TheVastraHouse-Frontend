"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { captureAndSendAttribution } from "@/lib/commerce";

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
          },
        },
      }),
  );

  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) {
      return;
    }

    void captureAndSendAttribution();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
