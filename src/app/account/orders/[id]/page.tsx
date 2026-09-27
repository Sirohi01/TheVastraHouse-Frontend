import { AccountOrderDetailClient } from "@/components/account/AccountOrderDetailClient";

export const metadata = { robots: { follow: false, index: false }, title: "Order detail" };

export default async function AccountOrderDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <AccountOrderDetailClient orderNumber={decodeURIComponent(id)} />;
}
