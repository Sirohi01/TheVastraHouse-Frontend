import { AccountClient } from "@/components/account/AccountClient";

export const metadata = { robots: { follow: false, index: false }, title: "Rewards and credit" };

export default function AccountRewardsPage() {
  return <AccountClient view="rewards" />;
}
