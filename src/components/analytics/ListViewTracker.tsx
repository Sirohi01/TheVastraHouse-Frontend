"use client";

import { useEffect } from "react";
import { trackViewItemList, type AnalyticsItem } from "@/lib/analytics";

/** Fires GA4 view_item_list once per distinct list contents (consent is checked in trackEvent). */
export function ListViewTracker({
  items,
  listName,
}: Readonly<{ items: AnalyticsItem[]; listName: string }>) {
  const signature = items.map((item) => item.item_id).join("|");

  useEffect(() => {
    trackViewItemList(listName, items);
  }, [listName, signature]);

  return null;
}
