import type { ReactNode } from "react";
import { FaqAccordion, type FaqItem } from "@/components/marketing/faq-accordion";
import { SectionHeading } from "@/components/marketing/section-heading";
import { cn } from "@/lib/utils/cn";

/**
 * Draft marketing copy — kept deliberately general (no specific timelines,
 * warranty terms, or guarantees) since the owner requirements don't specify
 * FAQ content. Flag for client review before this is treated as final.
 */
const FAQS: FaqItem[] = [
  {
    question: "What services does BrickBasket offer?",
    answer:
      "We offer end-to-end construction and real estate solutions: project finance, land purchase, Vastu services, planning & design, construction & interior, rain water harvesting, pest control & water proofing, and post-construction support.",
  },
  {
    question: "How do I get started with a project?",
    answer:
      "Reach out through our Contact page with a few details about your project. Our team will follow up to understand your goals and walk you through next steps.",
  },
  {
    question: "Does BrickBasket help with financing?",
    answer:
      "Yes — our Project Finance service provides support to help structure funding for your project. Get in touch to discuss what's possible for your situation.",
  },
  {
    question: "What is Vastu Services and is it mandatory?",
    answer:
      "Vastu Services bring traditional Vastu principles into your site and design planning. It's offered as part of our process for clients who want it incorporated into their project.",
  },
  {
    question: "Which locations does BrickBasket serve?",
    answer:
      "We've delivered projects across multiple states — contact us with your location and we'll confirm feasibility for your project.",
  },
  {
    // FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass,
    // Phase 6): this answer used to name "Post Construction Support" as a
    // confirmed service — it isn't (see PENDING_SERVICES in
    // src/lib/content/public-site.ts, docs/OPEN_QUESTIONS.md #46). Reworded
    // to describe what's actually confirmed (Contract/handover) without
    // asserting an unconfirmed offering as fact.
    question: "What happens after construction is complete?",
    answer:
      "Handover is documented through your contract and project records, and our team stays reachable if questions come up afterward — reach out via Contact and we'll help.",
  },
];

/**
 * FAQ content, extracted so both the standalone `/faq` page and the Home
 * page's one-pager section render the exact same questions/answers — see
 * `docs/OPEN_QUESTIONS.md` #46 for the drift problem this pattern avoids.
 */
export function FaqSection({
  id,
  className,
  heading,
}: {
  id?: string;
  className?: string;
  /** Shown above the accordion — omit on the standalone page, which uses PageBanner instead. */
  heading?: { eyebrow?: string; title: ReactNode };
}) {
  return (
    <section id={id} className={cn("container py-16 md:py-20", className)}>
      {heading && <SectionHeading eyebrow={heading.eyebrow} title={heading.title} className="mb-10" />}
      <FaqAccordion items={FAQS} />
    </section>
  );
}
