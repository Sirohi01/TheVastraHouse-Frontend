import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { robots: { follow: false, index: false }, title: "Payments" };

export default function PaymentsPage() {
  redirect("/checkout");
}
