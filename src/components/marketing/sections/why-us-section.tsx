import type { ReactNode } from "react";
import { Award, Gem, Eye, Users2, Clock3, Smile } from "lucide-react";
import { ImagePlaceholder } from "@/components/marketing/image-placeholder";
import { SectionHeading } from "@/components/marketing/section-heading";
import { cn } from "@/lib/utils/cn";

// Matches the approved "Why Choose BrickBasket?" UI reference exactly.
const REASONS = [
  {
    icon: Award,
    title: "15+ Years of Experience",
    description: "A proven track record of delivering excellence across diverse projects.",
  },
  {
    icon: Gem,
    title: "Quality Assurance",
    description: "We use premium quality materials and follow strict quality control at every step.",
  },
  {
    icon: Eye,
    title: "Transparent Process",
    description: "Clear communication and complete transparency from start to finish.",
  },
  {
    icon: Users2,
    title: "Expert Team",
    description: "Skilled engineers and professionals dedicated to delivering the best results.",
  },
  {
    icon: Clock3,
    title: "On-Time Delivery",
    description: "We respect your time and ensure on-time project completion.",
  },
  {
    icon: Smile,
    title: "Customer Satisfaction",
    description: "Our clients' trust and satisfaction are at the heart of everything we do.",
  },
];

/**
 * "Why BrickBasket" content, extracted so both the standalone `/why-us`
 * page and the Home page's one-pager section render the exact same copy —
 * see `docs/OPEN_QUESTIONS.md` #46 for the drift problem this pattern
 * avoids.
 */
export function WhyUsSection({
  id,
  className,
  heading,
}: {
  id?: string;
  className?: string;
  /** Shown above the grid — omit on the standalone page, which uses PageBanner instead. */
  heading?: { eyebrow?: string; title: ReactNode };
}) {
  return (
    <section id={id} className={cn("container py-16 md:py-20", className)}>
      {heading && <SectionHeading eyebrow={heading.eyebrow} title={heading.title} className="mb-10" />}
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <ImagePlaceholder
          alt="Construction site at dusk with tower cranes over a coastal high-rise under construction"
          src="/images/why-us-construction.jpg"
        />
        <ul className="flex flex-col gap-6">
          {REASONS.map((reason) => {
            const Icon = reason.icon;
            return (
              <li key={reason.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h3 className="font-heading text-base font-semibold text-ink">{reason.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{reason.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
