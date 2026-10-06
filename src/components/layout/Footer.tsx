import { Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { CookieSettingsLink } from "@/components/analytics/CookieSettingsLink";
import { NewsletterForm } from "@/components/engagement/NewsletterForm";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import {
  defaultCmsContent,
  defaultFooterHelpLinks,
  defaultFooterShopLinks,
  type CmsContent,
  type CmsLink,
} from "@/lib/cms";

export type FooterPage = { slug: string; title: string };

type FooterLink = { href: string; label: string };

const MAROON = "#3a0f19";
const GOLD = "#d8b66d";

// Fine gold lattice (jaali) on deep maroon.
const JAALI_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='%23d8b66d' stroke-opacity='0.11' stroke-width='1'%3E%3Cpath d='M28 4l24 24-24 24L4 28z'/%3E%3Cpath d='M28 16l12 12-12 12-12-12z'/%3E%3Ccircle cx='28' cy='28' r='3'/%3E%3C/g%3E%3C/svg%3E")`;

// A row of small domes: the palace-arch skyline that crowns the footer.
const DOME_EDGE = `radial-gradient(circle at 50% 100%, ${MAROON} 11px, transparent 11.5px)`;

export function Footer({ cms, pages = [] }: Readonly<{ cms?: CmsContent; pages?: FooterPage[] }>) {
  const content = cms ?? defaultCmsContent;
  const footer = content.footer;
  const logo = footer?.brandLogo;
  const email = footer?.email;
  const phone = footer?.phone;
  const location = footer?.location;
  const instagramUrl = footer?.instagramUrl;
  const whatsappUrl = footer?.whatsappUrl;

  const shopLinks = [
    ...usableLinks(footer?.shopLinks, defaultFooterShopLinks),
    ...usableLinks(footer?.links),
  ];
  const helpLinks = usableLinks(footer?.helpLinks, defaultFooterHelpLinks);
  const policyLinks: FooterLink[] = pages.length
    ? pages.map((page) => ({ href: `/policies/${page.slug}`, label: page.title }))
    : [{ href: "/policies", label: "All policies" }];

  const copyright =
    footer?.copyrightText?.trim() ||
    `© ${new Date().getFullYear()} The Vastra House. All rights reserved.`;
  const hasContact = Boolean(email || phone || location);
  const hasSocial = Boolean(instagramUrl || whatsappUrl || email);

  return (
    <footer className="font-[family-name:var(--font-body)]">
      <div
        aria-hidden="true"
        className="h-[11px] bg-[#fbf7ef]"
        style={{
          backgroundImage: DOME_EDGE,
          backgroundSize: "22px 11px",
          backgroundRepeat: "repeat-x",
        }}
      />

      <div
        className="relative overflow-hidden text-[#f6ecda]"
        style={{
          backgroundColor: MAROON,
          backgroundImage: `radial-gradient(ellipse 70% 60% at 50% 0%, rgba(122,31,43,0.55), transparent 70%), ${JAALI_PATTERN}`,
        }}
      >
        <div className="h-[3px] bg-[linear-gradient(90deg,transparent,#caa14e,#f0d9a4,#caa14e,transparent)]" />

        <div className="relative mx-auto max-w-7xl px-5 pb-5 pt-8 md:pt-10">
          {/* Crest */}
          <div className="flex flex-col items-center text-center">
            <Link aria-label="The Vastra House home" className="inline-block" href="/">
              {logo?.url ? (
                <span className="relative block w-20 rounded-t-[999px] rounded-b-md border border-[#caa14e] bg-[#fffaf1] p-2 pt-4 shadow-[0_0_0_4px_rgba(216,182,109,0.18)] md:w-24">
                  <ResponsiveImage
                    alt={logo.altText || "The Vastra House logo"}
                    aspectRatio={logo.aspectRatio ?? "1:1"}
                    objectFit={logo.objectFit ?? "contain"}
                    src={logo.url}
                  />
                </span>
              ) : (
                <span className="block">
                  <span className="block font-[family-name:var(--font-display)] text-3xl font-medium uppercase tracking-[0.28em] text-[#e6c67a] md:text-4xl">
                    Vastra
                  </span>
                  <span className="mt-1 block text-[10px] font-normal uppercase tracking-[0.7em] text-[#d8b66d]">
                    House
                  </span>
                </span>
              )}
            </Link>

            <Divider className="mt-4" />

            <p className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-lg italic leading-7 text-[#f6ecda]/90 md:text-xl">
              {footer?.tagline ||
                "Thoughtfully made Indian wear with polished details, comfortable fabrics, and occasion-ready styling."}
            </p>
          </div>

          {/* Newsletter */}
          <div className="mx-auto mt-6 max-w-xl text-center">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-medium uppercase tracking-[0.18em] text-[#e6c67a]">
              {footer?.newsletterTitle?.trim() || "Join the House"}
            </h2>
            <p className="mt-1.5 text-sm font-light leading-6 text-[#f6ecda]/75">
              {footer?.newsletterText?.trim() ||
                "New arrivals, festive edits and early access. No spam."}
            </p>
            <div className="text-left">
              <NewsletterForm source="footer" tone="dark" />
            </div>
          </div>

          <Divider className="mt-7" />

          {/* Link columns */}
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-4 md:gap-x-10">
            <LinkGroup links={shopLinks} title="Shop" />
            <LinkGroup links={helpLinks} title="Help" />
            <div className="col-span-2 md:col-span-1">
              <LinkGroup links={policyLinks} title="Policies" />
            </div>
            {hasContact || hasSocial ? (
              <div className="col-span-2 text-center md:col-span-1 md:text-left">
                <ColumnTitle>Contact</ColumnTitle>
                {hasContact ? (
                  <address className="mt-4 grid justify-items-center gap-3 text-sm not-italic md:justify-items-start">
                    {email ? (
                      <ContactLink
                        href={`mailto:${email}`}
                        icon={<Mail aria-hidden="true" size={15} />}
                      >
                        {email}
                      </ContactLink>
                    ) : null}
                    {phone ? (
                      <ContactLink
                        href={`tel:${phone.replace(/\s+/g, "")}`}
                        icon={<Phone aria-hidden="true" size={15} />}
                      >
                        {phone}
                      </ContactLink>
                    ) : null}
                    {location ? (
                      <span className="inline-flex items-start gap-2.5 text-[#f6ecda]/80">
                        <MapPin
                          aria-hidden="true"
                          className="mt-0.5 shrink-0 text-[#d8b66d]"
                          size={15}
                        />
                        {location}
                      </span>
                    ) : null}
                  </address>
                ) : null}
                {hasSocial ? (
                  <div className="mt-5 flex items-center justify-center gap-2.5 md:justify-start">
                    {instagramUrl ? (
                      <SocialLink href={instagramUrl} label="Instagram">
                        <Instagram aria-hidden="true" size={16} />
                      </SocialLink>
                    ) : null}
                    {whatsappUrl ? (
                      <SocialLink href={whatsappUrl} label="WhatsApp">
                        <MessageCircle aria-hidden="true" size={16} />
                      </SocialLink>
                    ) : null}
                    {email ? (
                      <SocialLink href={`mailto:${email}`} label="Email us">
                        <Mail aria-hidden="true" size={16} />
                      </SocialLink>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#caa14e]/30 bg-[#2a0a11]/70">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-5 py-3.5 text-center text-xs text-[#d9c9ae] md:flex-row md:justify-between md:text-left">
            <span>{copyright}</span>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <CookieSettingsLink />
              <Link href="/policies">Policies</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function usableLinks(links?: CmsLink[], fallback: CmsLink[] = []): FooterLink[] {
  const source = links?.length ? links : fallback;

  return source
    .filter(
      (link) =>
        link.enabled !== false &&
        link.href &&
        link.label &&
        !link.href.startsWith("/admin") &&
        link.href !== "/payments",
    )
    .map((link) => ({ href: link.href, label: link.label }));
}

function isExternal(href: string) {
  return /^(https?:|mailto:|tel:)/i.test(href);
}

/** Gold rule with a small diamond ornament in the middle. */
function Divider({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <div
      aria-hidden="true"
      className={`flex w-full max-w-md items-center gap-3 self-center mx-auto ${className}`}
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#caa14e]/80" />
      <svg className="h-3.5 w-9 shrink-0" fill="none" viewBox="0 0 36 14">
        <path d="M18 1l4 6-4 6-4-6z" fill={GOLD} />
        <path d="M10 7H3M26 7h7" stroke={GOLD} strokeLinecap="round" strokeWidth="1" />
        <circle cx="1.5" cy="7" fill={GOLD} r="1.2" />
        <circle cx="34.5" cy="7" fill={GOLD} r="1.2" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#caa14e]/80" />
    </div>
  );
}

function ColumnTitle({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <p className="font-[family-name:var(--font-display)] text-xl font-medium uppercase tracking-[0.16em] text-[#e6c67a]">
        {children}
      </p>
      <span aria-hidden="true" className="mx-auto mt-2 block h-px w-10 bg-[#caa14e] md:mx-0" />
    </>
  );
}

function LinkGroup({ links, title }: Readonly<{ links: FooterLink[]; title: string }>) {
  if (!links.length) return null;

  return (
    <nav aria-label={title} className="text-center md:text-left">
      <ColumnTitle>{title}</ColumnTitle>
      <ul className="mt-3 grid gap-2 text-sm">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            {isExternal(link.href) ? (
              <a
                className="group inline-block"
                href={link.href}
                rel="noopener noreferrer"
                target={link.href.startsWith("http") ? "_blank" : undefined}
              >
                <LinkText>{link.label}</LinkText>
              </a>
            ) : (
              <Link className="group inline-block" href={link.href}>
                <LinkText>{link.label}</LinkText>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Colour sits on the span: the global `a { color: inherit }` would override utilities on anchors. */
function LinkText({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <span className="border-b border-transparent pb-0.5 text-[#f6ecda]/80 transition-colors group-hover:border-[#caa14e] group-hover:text-[#e6c67a]">
      {children}
    </span>
  );
}

function ContactLink({
  children,
  href,
  icon,
}: Readonly<{ children: ReactNode; href: string; icon: ReactNode }>) {
  return (
    <a className="group inline-flex items-center gap-2.5" href={href}>
      <span className="text-[#d8b66d]">{icon}</span>
      <LinkText>{children}</LinkText>
    </a>
  );
}

function SocialLink({
  children,
  href,
  label,
}: Readonly<{ children: ReactNode; href: string; label: string }>) {
  return (
    <a
      aria-label={label}
      className="group inline-flex size-10 items-center justify-center rounded-full border border-[#caa14e]/70 transition hover:border-[#e6c67a] hover:bg-[#caa14e]"
      href={href}
      rel="noopener noreferrer"
      target={href.startsWith("http") ? "_blank" : undefined}
      title={label}
    >
      <span className="text-[#e6c67a] transition group-hover:text-[#2e0c12]">{children}</span>
    </a>
  );
}
