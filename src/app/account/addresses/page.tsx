import { AccountClient } from "@/components/account/AccountClient";

export const metadata = { robots: { follow: false, index: false }, title: "Addresses" };

export default function AccountAddressesPage() {
  return <AccountClient view="addresses" />;
}
