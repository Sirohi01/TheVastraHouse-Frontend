import { AccountClient } from "@/components/account/AccountClient";

export const metadata = { robots: { follow: false, index: false }, title: "Account sessions" };

export default function AccountSessionsPage() {
  return <AccountClient view="sessions" />;
}
