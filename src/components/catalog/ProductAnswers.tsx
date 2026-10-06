import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog";
import type { SeoSettings } from "@/lib/seo";

type Answer = { question: string; answer: string };

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

/**
 * Builds Q&A strictly from stored product data and published store settings. A question is
 * only emitted when its answer is backed by data, so nothing here can contradict the catalogue.
 */
export function buildProductAnswers(
  product: CatalogProduct,
  commerce: SeoSettings["commerce"],
): Answer[] {
  const answers: Answer[] = [];
  const active = product.variants.filter((variant) => variant.active !== false);
  const sizes = [...new Set(active.map((variant) => variant.size).filter(Boolean))] as string[];
  const colors = [...new Set(active.map((variant) => variant.color).filter(Boolean))] as string[];

  if (product.fabricDetails?.trim()) {
    answers.push({
      answer: product.fabricDetails.trim(),
      question: `What is the ${product.name} made of?`,
    });
  }
  if (sizes.length) {
    answers.push({
      answer: `${product.name} is listed in ${sizes.join(", ")}${colors.length ? ` (colour: ${colors.join(", ")})` : ""}. Check the size guide for bust, waist, hip, shoulder and length measurements before ordering.`,
      question: `Which sizes does the ${product.name} come in?`,
    });
  }
  if (product.washCare?.trim()) {
    answers.push({
      answer: product.washCare.trim(),
      question: `How do I wash and care for the ${product.name}?`,
    });
  }
  if (commerce) {
    answers.push({
      answer: `Standard shipping within India is free on orders of ${formatInr(commerce.freeShippingThreshold)} or more; below that it costs ${formatInr(commerce.shippingStandardFee)}. Delivery timelines are described in the shipping policy.`,
      question: "How much does shipping cost?",
    });
    answers.push({
      answer: `You can request a return within ${commerce.returnWindowDays} days of delivery. Items must be unused, unwashed and have their original tags. See the return policy for refund details and non-returnable items.`,
      question: "What is the return policy?",
    });
  }
  const preOrder = active.find((variant) => variant.availability?.canPreOrder);
  if (preOrder) {
    answers.push({
      answer:
        "This item is available as a pre-order and is made after you order. The expected dispatch date is shown in the pre-order details on this page.",
      question: "Is this a pre-order item?",
    });
  }
  return answers;
}

export function ProductAnswers({
  commerce,
  product,
}: Readonly<{ commerce: SeoSettings["commerce"]; product: CatalogProduct }>) {
  const answers = buildProductAnswers(product, commerce);
  if (!answers.length) return null;

  return (
    <section
      aria-labelledby="product-answers-heading"
      className="mx-auto mt-10 max-w-7xl px-4 pb-10 sm:px-6 lg:px-8"
    >
      <h2 className="font-serif text-2xl text-[#3d1620]" id="product-answers-heading">
        Questions about the {product.name}
      </h2>
      <dl className="mt-5 grid gap-4 md:grid-cols-2">
        {answers.map((item) => (
          <div className="rounded-md border border-[#e5dac7] bg-[#fffaf1] p-5" key={item.question}>
            <dt className="font-semibold text-[#3d1620]">{item.question}</dt>
            <dd className="mt-2 text-sm leading-7 text-[#4f443a]">{item.answer}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 text-sm text-[#6f6256]">
        More help:{" "}
        <Link className="font-semibold text-[#6e1423] underline" href="/pages/size-guide">
          Size guide
        </Link>
        ,{" "}
        <Link className="font-semibold text-[#6e1423] underline" href="/policies/shipping-policy">
          Shipping policy
        </Link>
        ,{" "}
        <Link className="font-semibold text-[#6e1423] underline" href="/policies/return-policy">
          Return policy
        </Link>{" "}
        and{" "}
        <Link className="font-semibold text-[#6e1423] underline" href="/faq">
          FAQs
        </Link>
        .
      </p>
    </section>
  );
}
