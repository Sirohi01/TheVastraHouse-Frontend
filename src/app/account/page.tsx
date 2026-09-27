import { AccountClient } from "@/components/account/AccountClient";

export const metadata = { robots: { follow: false, index: false }, title: "My account" };

export default function AccountPage() {
  return <AccountClient view="dashboard" />;
}
