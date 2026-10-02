import type { Metadata } from "next";
import { ContactForm } from "@/components/content/ContactForm";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata, buildWebPageJsonLd, getSeoSettings } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSeoSettings();
  return buildPageMetadata(settings, {
    description:
      "Contact The Vastra House for orders, returns, shipping, wholesale and support enquiries.",
    name: "Contact",
    path: "/contact",
  });
}

export default function ContactPage() {
  return (
    <PublicPageFrame
      eyebrow="Support"
      title="Contact"
      description="Send your enquiry to our support team."
    >
      <Breadcrumbs items={[{ name: "Contact", path: "/contact" }]} />
      <JsonLd
        data={buildWebPageJsonLd({
          description: "Contact The Vastra House support.",
          name: "Contact",
          path: "/contact",
          type: "ContactPage",
        })}
      />
      <div className="mt-5 max-w-2xl">
        <ContactForm />
      </div>
    </PublicPageFrame>
  );
}
