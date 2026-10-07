"use client";

import {
  ChevronRight,
  Heart,
  Instagram,
  Mail,
  MessageCircle,
  Phone,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type MenuLink = { href: string; label: string };

type MobileMenuProps = Readonly<{
  accountHref: string;
  accountLabel: string;
  cartCount: number;
  email?: string;
  instagramUrl?: string;
  links: MenuLink[];
  logoUrl?: string;
  logoAlt?: string;
  note?: string;
  phone?: string;
  whatsappUrl?: string;
}>;

const PANEL_BG = [
  "radial-gradient(ellipse 120% 40% at 50% 0%, rgba(140,36,52,0.55), transparent 70%)",
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='%23d8b66d' stroke-opacity='0.1' stroke-width='1'%3E%3Cpath d='M28 4l24 24-24 24L4 28z'/%3E%3Cpath d='M28 16l12 12-12 12-12-12z'/%3E%3Ccircle cx='28' cy='28' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
].join(", ");

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileMenu({
  accountHref,
  accountLabel,
  cartCount,
  email,
  instagramUrl,
  links,
  logoAlt,
  logoUrl,
  note,
  phone,
  whatsappUrl,
}: MobileMenuProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => setMounted(true), []);

  // A navigation (or resize to desktop) should never leave the drawer open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1280px)");
    const onChange = () => query.matches && setOpen(false);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 60);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [close, open]);

  const reveal = (index: number) => ({
    className: `transition-all duration-500 ease-out motion-reduce:transition-none ${
      open ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
    }`,
    style: { transitionDelay: open ? `${140 + index * 55}ms` : "0ms" },
  });

  const hasContact = Boolean(email || phone);
  const hasSocial = Boolean(instagramUrl || whatsappUrl);

  return (
    <>
      <button
        aria-controls="mobile-menu"
        aria-expanded={open}
        aria-label="Open menu"
        className="group inline-flex size-10 items-center justify-center rounded-full text-[#3b3128] transition hover:bg-[#f3eadb] xl:hidden"
        onClick={() => setOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <svg aria-hidden="true" className="size-[22px]" fill="none" viewBox="0 0 24 24">
          <path
            d="M3 7h18M3 12h12M3 17h18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </svg>
      </button>

      {mounted
        ? createPortal(
            <div
              className={`fixed inset-0 z-[100] font-[family-name:var(--font-body)] xl:hidden ${
                open ? "" : "pointer-events-none"
              }`}
              inert={!open}
            >
              <div
                aria-hidden="true"
                className={`absolute inset-0 bg-[#1c0508]/65 backdrop-blur-[3px] transition-opacity duration-300 motion-reduce:transition-none ${
                  open ? "opacity-100" : "opacity-0"
                }`}
                onClick={close}
              />

              <aside
                aria-label="Menu"
                aria-modal="true"
                className={`absolute right-0 top-0 flex h-full w-[88%] max-w-[380px] flex-col overflow-y-auto overscroll-contain bg-[#3a0f19] text-[#f6ecda] shadow-[-24px_0_60px_-20px_rgba(0,0,0,0.6)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  open ? "translate-x-0" : "translate-x-full"
                }`}
                id="mobile-menu"
                ref={panelRef}
                role="dialog"
                style={{ backgroundImage: PANEL_BG }}
              >
                <div className="h-[3px] shrink-0 bg-[linear-gradient(90deg,transparent,#caa14e,#f0d9a4,#caa14e,transparent)]" />

                <div className="flex items-center justify-between px-6 pb-2 pt-5">
                  <a aria-label="The Vastra House home" href="/">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={logoAlt || "The Vastra House"}
                        className="h-10 w-auto rounded-sm bg-[#fffaf1] p-1"
                        src={logoUrl}
                      />
                    ) : (
                      <span className="block leading-none">
                        <span className="block font-[family-name:var(--font-display)] text-[28px] font-medium uppercase tracking-[0.26em] text-[#e6c67a]">
                          Vastra
                        </span>
                        <span className="mt-1 block text-[8px] uppercase tracking-[0.6em] text-[#d8b66d]">
                          House
                        </span>
                      </span>
                    )}
                  </a>
                  <button
                    aria-label="Close menu"
                    className="group inline-flex size-10 items-center justify-center rounded-full border border-[#caa14e]/60 transition hover:border-[#e6c67a] hover:bg-[#caa14e]/15"
                    onClick={close}
                    ref={closeRef}
                    type="button"
                  >
                    <span className="text-[#e6c67a]">
                      <X aria-hidden="true" size={18} />
                    </span>
                  </button>
                </div>

                <GoldDivider className="px-6" />

                {/* Search */}
                <div className="px-6 pt-5">
                  <a
                    className="flex h-11 items-center gap-3 rounded-full border border-[#caa14e]/40 bg-[#fffaf1]/5 px-4 transition hover:border-[#e6c67a]/80"
                    href="/shop"
                  >
                    <span className="text-[#d8b66d]">
                      <Search aria-hidden="true" size={16} />
                    </span>
                    <span className="text-[13px] font-light tracking-wide text-[#f6ecda]/70">
                      Search the collection
                    </span>
                  </a>
                </div>

                {/* Links */}
                <nav aria-label="Main menu" className="px-6 pt-3">
                  <ul>
                    {links.map((link, index) => {
                      const active = isActive(pathname, link.href);
                      const motion = reveal(index);

                      return (
                        <li
                          className={`border-b border-[#caa14e]/20 ${motion.className}`}
                          key={`${link.href}-${link.label}`}
                          style={motion.style}
                        >
                          <a
                            aria-current={active ? "page" : undefined}
                            className="group flex items-center justify-between py-[15px]"
                            href={link.href}
                          >
                            <span
                              className={`flex items-center gap-3 font-[family-name:var(--font-display)] text-[26px] font-medium uppercase leading-none tracking-[0.1em] transition-colors ${
                                active
                                  ? "text-[#e6c67a]"
                                  : "text-[#f6ecda] group-hover:text-[#e6c67a]"
                              }`}
                            >
                              {active ? (
                                <span
                                  aria-hidden="true"
                                  className="size-1.5 rotate-45 bg-[#caa14e]"
                                />
                              ) : null}
                              {link.label}
                            </span>
                            <span className="text-[#caa14e] transition-transform group-hover:translate-x-1">
                              <ChevronRight aria-hidden="true" size={18} />
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                {/* Quick actions */}
                <div className="grid grid-cols-3 gap-2.5 px-6 pt-6">
                  <ActionTile href={accountHref} label={accountLabel.replace("Customer ", "")}>
                    <UserRound aria-hidden="true" size={19} />
                  </ActionTile>
                  <ActionTile href="/wishlist" label="Wishlist">
                    <Heart aria-hidden="true" size={19} />
                  </ActionTile>
                  <ActionTile badge={cartCount} href="/cart" label="Cart">
                    <ShoppingBag aria-hidden="true" size={19} />
                  </ActionTile>
                </div>

                {/* Contact */}
                <div className="mt-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8">
                  <GoldDivider />
                  {hasContact ? (
                    <div className="mt-5 grid gap-2.5 text-[13px]">
                      {email ? (
                        <a className="flex items-center gap-2.5" href={`mailto:${email}`}>
                          <span className="text-[#d8b66d]">
                            <Mail aria-hidden="true" size={15} />
                          </span>
                          <span className="text-[#f6ecda]/80">{email}</span>
                        </a>
                      ) : null}
                      {phone ? (
                        <a
                          className="flex items-center gap-2.5"
                          href={`tel:${phone.replace(/\s+/g, "")}`}
                        >
                          <span className="text-[#d8b66d]">
                            <Phone aria-hidden="true" size={15} />
                          </span>
                          <span className="text-[#f6ecda]/80">{phone}</span>
                        </a>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-5 flex items-center justify-between gap-3">
                    {note ? (
                      <p className="max-w-[190px] text-[10.5px] font-light uppercase leading-4 tracking-[0.16em] text-[#d8b66d]">
                        {note}
                      </p>
                    ) : (
                      <span />
                    )}
                    {hasSocial ? (
                      <div className="flex gap-2">
                        {instagramUrl ? (
                          <SocialDot href={instagramUrl} label="Instagram">
                            <Instagram aria-hidden="true" size={16} />
                          </SocialDot>
                        ) : null}
                        {whatsappUrl ? (
                          <SocialDot href={whatsappUrl} label="WhatsApp">
                            <MessageCircle aria-hidden="true" size={16} />
                          </SocialDot>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function isActive(pathname: string, href: string) {
  const path = href.split("?")[0];
  if (path === "/") return pathname === "/";
  // Links that differ only by query (New Arrivals vs Shop) stay inactive to avoid double highlights.
  if (href.includes("?")) return false;
  return pathname === path || pathname.startsWith(`${path}/`);
}

function GoldDivider({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <div aria-hidden="true" className={`flex items-center gap-3 ${className}`}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#caa14e]/70" />
      <svg className="h-3 w-8 shrink-0" fill="none" viewBox="0 0 36 14">
        <path d="M18 1l4 6-4 6-4-6z" fill="#d8b66d" />
        <path d="M10 7H3M26 7h7" stroke="#d8b66d" strokeLinecap="round" />
        <circle cx="1.5" cy="7" fill="#d8b66d" r="1.2" />
        <circle cx="34.5" cy="7" fill="#d8b66d" r="1.2" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#caa14e]/70" />
    </div>
  );
}

function ActionTile({
  badge = 0,
  children,
  href,
  label,
}: Readonly<{ badge?: number; children: ReactNode; href: string; label: string }>) {
  return (
    <a
      className="group relative flex flex-col items-center gap-1.5 rounded-xl border border-[#caa14e]/35 bg-[#fffaf1]/[0.04] py-3.5 transition hover:border-[#e6c67a]/80 hover:bg-[#caa14e]/10"
      href={href}
    >
      <span className="text-[#e6c67a]">{children}</span>
      <span className="text-[10.5px] font-normal uppercase tracking-[0.16em] text-[#f6ecda]/85">
        {label}
      </span>
      {badge > 0 ? (
        <span className="absolute right-2 top-2 grid min-w-[18px] place-items-center rounded-full bg-gradient-to-b from-[#e6c67a] to-[#c39a45] px-1 text-[10px] font-semibold leading-[18px] text-[#2e0c12]">
          {badge}
        </span>
      ) : null}
    </a>
  );
}

function SocialDot({
  children,
  href,
  label,
}: Readonly<{ children: ReactNode; href: string; label: string }>) {
  return (
    <a
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-full border border-[#caa14e]/60 transition hover:border-[#e6c67a] hover:bg-[#caa14e]"
      href={href}
      rel="noopener noreferrer"
      target={href.startsWith("http") ? "_blank" : undefined}
      title={label}
    >
      <span className="text-[#e6c67a]">{children}</span>
    </a>
  );
}
