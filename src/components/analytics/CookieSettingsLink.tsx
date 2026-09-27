"use client";

import { reopenCookieSettings } from "@/components/analytics/Analytics";

export function CookieSettingsLink() {
  return (
    <button className="transition hover:text-primary" onClick={reopenCookieSettings} type="button">
      Cookie settings
    </button>
  );
}
