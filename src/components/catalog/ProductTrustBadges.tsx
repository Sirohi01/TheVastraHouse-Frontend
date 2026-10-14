import {
  Box,
  Heart,
  Leaf,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Truck,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { defaultProductTrustBadges, type CmsTrustBadge, type CmsTrustBadgeIcon } from "@/lib/cms";

const icons: Record<CmsTrustBadgeIcon, LucideIcon> = {
  box: Box,
  heart: Heart,
  leaf: Leaf,
  returns: RefreshCcw,
  shield: ShieldCheck,
  sparkles: Sparkles,
  truck: Truck,
  wallet: WalletCards,
};

/** Icon strip under the buy buttons. Falls back to the default list when none is configured. */
export function ProductTrustBadges({ badges }: Readonly<{ badges?: CmsTrustBadge[] }>) {
  const source = badges?.length ? badges : defaultProductTrustBadges;
  const items = source.filter((item) => item.enabled !== false && item.title);

  if (!items.length) {
    return null;
  }

  return (
    <ul
      aria-label="Our promises"
      className="mt-6 grid grid-cols-3 gap-y-5 rounded-sm border border-[#e1d6c4] bg-[#fffaf1] px-2 py-4 sm:grid-cols-6 sm:gap-y-0 sm:divide-x sm:divide-[#e1d6c4]"
    >
      {items.map((item) => {
        const Icon = icons[item.icon] ?? Sparkles;

        return (
          <li
            className="flex flex-col items-center gap-2 px-1.5 text-center"
            key={`${item.icon}-${item.title}`}
          >
            <Icon aria-hidden="true" className="text-[#6f4a3a]" size={26} strokeWidth={1.1} />
            <span className="text-[11px] leading-4 text-[#4f3a30]">
              {item.title}
              {item.subtitle ? (
                <span className="block text-[9.5px] text-[#7d6a5c]">{item.subtitle}</span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
