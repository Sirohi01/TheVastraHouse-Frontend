import { serializeJsonLd } from "@/lib/seo";

/** Inline structured data, safely serialised against script-breaking content. */
export function JsonLd({ data }: Readonly<{ data: Record<string, unknown> | null | undefined }>) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
