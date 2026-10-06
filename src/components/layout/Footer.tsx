import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { CookieSettingsLink } from "@/components/analytics/CookieSettingsLink";
import { NewsletterForm } from "@/components/engagement/NewsletterForm";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { defaultCmsContent, type CmsContent } from "@/lib/cms";

export type FooterPage = { slug: string; title: string };

const shopLinks = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?sort=-newest", label: "New arrivals" },
  { href: "/shop?sort=-bestSelling", label: "Best sellers" },
  { href: "/pre-order", label: "Pre-order" },
  { href: "/blog", label: "Journal" },
];

const helpLinks = [
  { href: "/account", label: "My account" },
  { href: "/account/orders", label: "My orders" },
  { href: "/track-order", label: "Track order" },
  { href: "/faq", label: "FAQs" },
  { href: "/pages/size-guide", label: "Size guide" },
  { href: "/contact", label: "Contact us" },
  { href: "/about", label: "About us" },
];

export function Footer({ cms, pages = [] }: Readonly<{ cms?: CmsContent; pages?: FooterPage[] }>) {
  const content = cms ?? defaultCmsContent;
  const logo = content.footer?.brandLogo;
  const email = content.footer?.email;
  const phone = content.footer?.phone;
  const location = content.footer?.location;
  const instagramUrl = content.footer?.instagramUrl;
  const extraLinks = (content.footer?.links ?? []).filter(
    (link) =>
      link.href && link.label && !link.href.startsWith("/admin") && link.href !== "/payments",
  );
  const policyLinks = pages.map((page) => ({ href: `/pages/${page.slug}`, label: page.title }));

  return (
    <footer className="border-t border-[#e5dac7] bg-[#fffaf1]">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <Link aria-label="The Vastra House home" className="inline-block" href="/">
            {logo?.url ? (
              <span className="block w-36">
                <ResponsiveImage
                  alt={logo.altText ?? "The Vastra House logo"}
                  aspectRatio={logo.aspectRatio ?? "1:1"}
                  objectFit={logo.objectFit ?? "contain"}
                  src={logo.url}
                />
              </span>
            ) : (
              <span className="font-serif text-2xl uppercase tracking-[0.18em] text-[#8a6a42]">
                Vastra House
              </span>
            )}
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#6f6256]">
            {content.footer?.tagline ??
              "Thoughtfully made Indian wear with polished details, comfortable fabrics, and occasion-ready styling."}
          </p>
          <address className="mt-5 flex flex-wrap gap-3 text-sm not-italic text-[#6f6256]">
            {email ? (
              <ContactLink href={`mailto:${email}`} icon={<Mail aria-hidden="true" size={16} />}>
                {email}
              </ContactLink>
            ) : null}
            {phone ? (
              <ContactLink
                href={`tel:${phone.replace(/\s+/g, "")}`}
                icon={<Phone aria-hidden="true" size={16} />}
              >
                {phone}
              </ContactLink>
            ) : null}
            {location ? (
              <span className="inline-flex items-center gap-2">
                <MapPin aria-hidden="true" size={16} />
                {location}
              </span>
            ) : null}
          </address>
          <div className="mt-6 max-w-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#3b3128]">
              Newsletter
            </p>
            <p className="mt-1 text-sm text-[#6f6256]">
              New arrivals, festive edits and early access. No spam.
            </p>
            <NewsletterForm source="footer" />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <LinkGroup links={[...shopLinks, ...extraLinks]} title="Shop" />
          <LinkGroup links={helpLinks} title="Help" />
          <LinkGroup links={policyLinks} title="Policies" />
        </div>
      </div>

      <div className="border-t border-[#e5dac7]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-xs text-[#6f6256] sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} The Vastra House. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-4">
            <CookieSettingsLink />
            {instagramUrl ? (
              <a
                className="inline-flex items-center gap-2 transition hover:text-primary"
                href={instagramUrl}
                rel="noopener noreferrer"
                target={instagramUrl.startsWith("http") ? "_blank" : undefined}
              >
                <Instagram aria-hidden="true" size={15} />
                Instagram
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}

function LinkGroup({
  links,
  title,
}: Readonly<{ links: Array<{ href: string; label: string }>; title: string }>) {
  if (!links.length) return null;

  return (
    <nav aria-label={title}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#3b3128]">{title}</p>
      <ul className="mt-3 grid gap-2 text-sm text-[#6f6256]">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link className="transition hover:text-primary" href={link.href}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ContactLink({
  children,
  href,
  icon,
}: Readonly<{ children: React.ReactNode; href: string; icon: React.ReactNode }>) {
  return (
    <a className="inline-flex items-center gap-2 transition hover:text-primary" href={href}>
      {icon}
      {children}
    </a>
  );
}
