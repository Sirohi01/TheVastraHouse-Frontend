import { JsonLd } from "@/components/seo/JsonLd";
import { buildFaqJsonLd } from "@/lib/seo";

/**
 * Visible FAQ accordion. FAQPage schema is emitted only alongside the visible questions,
 * which keeps structured data consistent with on-page content.
 */
export function ContentFaqs({
  faqs,
  title = "Frequently asked questions",
  withSchema = true,
}: Readonly<{
  faqs: Array<{ question: string; answer: string }>;
  title?: string;
  withSchema?: boolean;
}>) {
  if (!faqs.length) return null;

  return (
    <section
      aria-labelledby="faq-heading"
      className="mt-8 rounded-sm border border-[#e1d6c4] bg-[#fffdf8] p-5"
    >
      {withSchema ? <JsonLd data={buildFaqJsonLd(faqs)} /> : null}
      <h2 className="font-serif text-2xl uppercase text-[#3d1620]" id="faq-heading">
        {title}
      </h2>
      <div className="mt-4 divide-y divide-[#e5dac7]">
        {faqs.map((faq) => (
          <details className="group py-3" key={faq.question}>
            <summary className="cursor-pointer list-none text-sm font-semibold text-[#3d1620] marker:hidden">
              <span className="flex items-center justify-between gap-3">
                <span>{faq.question}</span>
                <span aria-hidden="true" className="text-primary transition group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#6f6256]">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
