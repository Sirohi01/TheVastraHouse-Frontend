import { AccountClient } from "@/components/account/AccountClient";

export const metadata = { robots: { follow: false, index: false }, title: "My orders" };

export default function AccountOrdersPage() {
  return <AccountClient view="orders" />;
}
