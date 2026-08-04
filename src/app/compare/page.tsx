import { CompareClient } from "@/components/catalog/CompareClient";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";

export default function ComparePage() {
  return (
    <PublicPageFrame
      eyebrow="Compare"
      title="Compare Products"
      description="Compare selected products by price, available variants, fabric, wash care, and highlights."
    >
      <CompareClient />
    </PublicPageFrame>
  );
}
