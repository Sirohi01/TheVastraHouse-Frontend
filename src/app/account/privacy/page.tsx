import { AccountClient } from "@/components/account/AccountClient";

export const metadata = { robots: { follow: false, index: false }, title: "Privacy preferences" };

export default function AccountPrivacyPage() {
  return <AccountClient view="privacy" />;
}
