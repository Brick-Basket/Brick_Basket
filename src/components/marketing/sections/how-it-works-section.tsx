import type { ReactNode } from "react";
import { MessageSquare, MapPin, Compass, ClipboardList, HardHat, KeyRound } from "lucide-react";
import { SectionHeading } from "@/components/marketing/section-heading";
import { cn } from "@/lib/utils/cn";

// A sensible process narrative built from the already-confirmed service
// list (Land Purchase, Vastu, Planning & Design, Construction & Interior) —
// a frontend editorial decision, not a contractual SLA. See ARCHITECTURE.md
// business-rule discipline (this is not an owner-specified workflow).
const STEPS = [
  {
    icon: MessageSquare,
    title: "Enquiry & Consultation",
    description: "Tell us about your project — we understand your goals, budget and timeline.",
  },
  {
    icon: MapPin,
    title: "Land Purchase (if needed)",
    description: "We help you find and evaluate the right land for your investment.",
  },
  {
    icon: Compass,
    title: "Vastu & Site Assessment",
    description: "Expert Vastu guidance is factored in before design work begins.",
  },
  {
    icon: ClipboardList,
    title: "Planning & Design",
    description: "Architectural plans and a scoped package are finalized with you.",
  },
  {
    icon: HardHat,
    title: "Construction & Interior",
    description: "Our team executes the build with regular progress updates.",
  },
  {
    icon: KeyRound,
    title: "Handover & Support",
    description: "You receive your finished space, with post-construction support after.",
  },
];

/**
 * "How It Works" content, extracted so both the standalone `/how-it-works`
 * page and the Home page's one-pager section render the exact same copy —
 * same pattern as `AboutSection`/`WhyUsSection`/`FaqSection`/
 * `ContactSection`, see `docs/OPEN_QUESTIONS.md` #46 for the drift problem
 * this pattern avoids.
 *
 * FRONTEND IMPLEMENTATION DECISION (Home hero "Watch Video" follow-up):
 * this page previously had no link anywhere in the site's navigation
 * (header, footer, or one-pager) — the only way to reach it was the Home
 * hero's "Watch Video" button, which is now wired to a real video instead
 * (see docs/CHANGELOG.md). Rather than leave `/how-it-works` orphaned,
 * it's now a proper one-pager section too, added to `MAIN_NAV` and the
 * footer's Quick Links, positioned right after Services — "what we do,
 * then how we do it" — and before Projects, which shows that process's
 * results.
 */
export function HowItWorksSection({
  id,
  className,
  heading,
}: {
  id?: string;
  className?: string;
  /** Shown above the steps — omit on the standalone page, which uses PageBanner instead. */
  heading?: { eyebrow?: string; title: ReactNode };
}) {
  return (
    <section id={id} className={cn("container py-16 md:py-20", className)}>
      {heading && <SectionHeading eyebrow={heading.eyebrow} title={heading.title} />}

      <ol className="relative mt-12 grid gap-10 md:grid-cols-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="relative flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-red text-white">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <span className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-red">
                Step {i + 1}
              </span>
              <h3 className="mt-1 font-heading text-base font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 max-w-xs text-sm text-ink-muted">{step.description}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
