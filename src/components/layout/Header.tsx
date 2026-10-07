"use client";

import { Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import { useEffect } from "react";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { commerceFetch, type Cart } from "@/lib/commerce";
import { defaultNavigation, type CmsContent } from "@/lib/cms";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";

const actionItems = [
  { icon: Search, label: "Search", href: "/shop" },
  { icon: Heart, label: "Wishlist", href: "/wishlist" },
  { icon: ShoppingBag, label: "Cart", href: "/cart" },
];

export function Header({ cms }: Readonly<{ cms?: CmsContent }>) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const itemCount = useCartStore((state) => state.itemCount);
  const setCart = useCartStore((state) => state.setCart);
  const navItems = (cms?.headerNavigation ?? [])
    .filter((link) => link.enabled !== false && link.href && link.label)
    .map((link) => ({ href: link.href, label: link.label }));
  const menuItems = navItems.length ? navItems : defaultNavigation;
  const splitAt = Math.ceil(menuItems.length / 2);
  const leftNavItems = menuItems.slice(0, splitAt);
  const rightNavItems = menuItems.slice(splitAt);
  const headerActionItems = [
    actionItems[0],
    {
      icon: UserRound,
      label: user ? "My account" : "Customer login",
      href: user ? "/account" : "/login",
    },
    ...actionItems.slice(1),
  ];

  useEffect(() => {
    async function hydrateCartCount() {
      try {
        const payload = await commerceFetch<{ cart: Cart }>("/commerce/cart", { accessToken });
        setCart(payload.cart);
      } catch {
        // Header should never block navigation if a guest cart cannot be loaded.
      }
    }

    void hydrateCartCount();
  }, [accessToken, setCart]);

  const topBarText = cms?.home?.topBarText?.trim() || "Free shipping on orders above ₹1,999";

  return (
    <header className="sticky top-0 z-50 border-b border-[#e5dac7] bg-[#fffaf1]/96 font-[family-name:var(--font-body)] backdrop-blur">
      <div
        className="relative overflow-hidden border-b border-[#d8c3a0]/70 bg-[#f5ede1] text-[#3a2a18]"
        style={{ backgroundImage: TOP_BAR_TEXTURE }}
      >
        <div className="relative mx-auto flex h-8 max-w-7xl items-center justify-center gap-2 px-3 text-[9.5px] font-normal uppercase tracking-[0.12em] md:h-9 md:gap-5 md:text-[11.5px] md:tracking-[0.3em]">
          <Ornament />
          <span className="truncate">{topBarText}</span>
          <Ornament />
        </div>
      </div>

      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-4 px-5 xl:grid xl:h-[60px] xl:grid-cols-[1fr_auto_1fr] xl:gap-5">
        <nav className="hidden items-center gap-9 text-[11px] font-normal uppercase tracking-[0.18em] text-[#3b3128] xl:flex">
          {leftNavItems.map((item) => (
            <a className="transition hover:text-primary" href={item.href} key={item.label}>
              {item.label}
            </a>
          ))}
        </nav>

        <a
          className="grid min-w-0 place-items-start text-left leading-none xl:min-w-48 xl:place-items-center xl:text-center"
          href="/"
        >
          {cms?.footer?.brandLogo?.url ? (
            <span className="block w-24 xl:w-28">
              <ResponsiveImage
                alt={cms.footer.brandLogo.altText ?? "The Vastra House logo"}
                aspectRatio={cms.footer.brandLogo.aspectRatio ?? "1:1"}
                objectFit={cms.footer.brandLogo.objectFit ?? "contain"}
                src={cms.footer.brandLogo.url}
              />
            </span>
          ) : (
            <>
              <span className="block font-[family-name:var(--font-display)] text-[26px] font-medium uppercase tracking-[0.22em] text-[#7a5a34] sm:text-[32px]">
                Vastra
              </span>
              <span className="block pl-1 text-[8px] font-normal uppercase tracking-[0.5em] text-[#7a5a34] sm:text-[9px] xl:pl-0">
                House
              </span>
            </>
          )}
        </a>

        <div className="flex items-center justify-end gap-3">
          <nav className="mr-4 hidden items-center gap-8 text-[11px] font-normal uppercase tracking-[0.18em] text-[#3b3128] xl:flex">
            {rightNavItems.map((item) => (
              <a className="transition hover:text-primary" href={item.href} key={item.label}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-1 md:flex">
            {headerActionItems.map((item) => (
              <HeaderActionItem item={item} itemCount={itemCount} key={item.label} />
            ))}
          </div>

          <a
            aria-label="Cart"
            className="relative inline-flex size-10 items-center justify-center rounded-md text-foreground transition hover:text-primary md:hidden"
            href="/cart"
            title="Cart"
          >
            <ShoppingBag aria-hidden="true" size={21} />
            {itemCount > 0 ? (
              <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-[#6e1423] px-1 text-[10px] font-bold leading-4 text-white">
                {itemCount}
              </span>
            ) : null}
          </a>

          <MobileMenu
            accountHref={headerActionItems[1].href}
            accountLabel={headerActionItems[1].label}
            cartCount={itemCount}
            email={cms?.footer?.email}
            instagramUrl={cms?.footer?.instagramUrl}
            links={menuItems}
            logoAlt={cms?.footer?.brandLogo?.altText}
            logoUrl={cms?.footer?.brandLogo?.url}
            note={topBarText}
            phone={cms?.footer?.phone}
            whatsappUrl={cms?.footer?.whatsappUrl}
          />
        </div>
      </div>
    </header>
  );
}

function HeaderActionItem({
  item,
  itemCount,
}: Readonly<{
  item: (typeof actionItems)[number];
  itemCount: number;
}>) {
  const Icon = item.icon;
  const showBadge = item.label === "Cart" && itemCount > 0;

  return (
    <a
      aria-label={item.label}
      className="relative inline-flex size-9 items-center justify-center text-[#3b3128] transition hover:text-primary"
      href={item.href}
      title={item.label}
    >
      <Icon aria-hidden="true" size={18} strokeWidth={1.5} />
      {showBadge ? (
        <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-[#7a4a1e] px-1 text-[10px] font-medium leading-4 text-white">
          {itemCount}
        </span>
      ) : null}
    </a>
  );
}

/** Soft watercolour wash + paper grain, matching the printed-textile look of the brand. */
const TOP_BAR_TEXTURE = [
  "radial-gradient(ellipse 22% 140% at 4% 40%, rgba(214,178,140,0.55), transparent 70%)",
  "radial-gradient(ellipse 20% 140% at 96% 60%, rgba(222,190,156,0.5), transparent 70%)",
  "radial-gradient(ellipse 30% 120% at 28% 90%, rgba(255,255,255,0.75), transparent 70%)",
  "radial-gradient(ellipse 26% 120% at 70% 10%, rgba(255,255,255,0.65), transparent 70%)",
  "radial-gradient(ellipse 18% 120% at 50% 50%, rgba(236,214,186,0.45), transparent 75%)",
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='60'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.018 0.06' numOctaves='3' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 0.55 0 0 0 0 0.38 0 0 0 0 0.2 0 0 0 0.5 -0.12'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
].join(", ");

function Ornament() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-7 shrink-0 text-[#7b4f24] md:h-[18px] md:w-8"
      fill="none"
      viewBox="0 0 32 18"
    >
      <path d="M16 1.5l3.2 7.5-3.2 7.5-3.2-7.5z" fill="currentColor" />
      <path
        d="M16 5.2c2.2 0 3.6 1.5 3.6 3.8M16 12.8c-2.2 0-3.6-1.5-3.6-3.8"
        stroke="#f5ede1"
        strokeLinecap="round"
        strokeWidth="0.9"
      />
      <path d="M12 9H5.5M20 9h6.5" stroke="currentColor" strokeLinecap="round" strokeWidth="0.9" />
      <circle cx="3.4" cy="9" fill="currentColor" r="1.3" />
      <circle cx="28.6" cy="9" fill="currentColor" r="1.3" />
      <circle cx="8.8" cy="5.6" fill="currentColor" r="0.8" />
      <circle cx="23.2" cy="5.6" fill="currentColor" r="0.8" />
      <circle cx="8.8" cy="12.4" fill="currentColor" r="0.8" />
      <circle cx="23.2" cy="12.4" fill="currentColor" r="0.8" />
    </svg>
  );
}
