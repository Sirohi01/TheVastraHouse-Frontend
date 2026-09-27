"use client";

import { useEffect } from "react";
import { trackSearch } from "@/lib/analytics";

/** Fires the GA4 `search` event once per rendered search term. */
export function SearchTracker({ term }: Readonly<{ term: string }>) {
  useEffect(() => {
    trackSearch(term);
  }, [term]);

  return null;
}
