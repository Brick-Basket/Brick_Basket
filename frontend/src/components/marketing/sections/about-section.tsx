import { Users, Building2, Clock, ClipboardCheck, ShieldCheck, Gem, Handshake, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/marketing/section-heading";
import { ImagePlaceholder } from "@/components/marketing/image-placeholder";
import { cn } from "@/lib/utils/cn";

// Marketing copy — matches the approved "About Us" UI reference. Company
// facts here (years, project counts) mirror the numbers already confirmed
// on the Home page; nothing new is introduced.
const STATS = [
  { icon: Users, value: "500+", label: "Happy Customers" },
  { icon: Building2, value: "250+", label: "Projects Completed" },
  { icon: Clock, value: "15+", label: "Years Industry Experience" },
  { icon: ClipboardCheck, value: "100%", label: "Quality Assurance" },
];

const CORE_VALUES = [
  {
    icon: ShieldCheck,
    title: "Transparency",
    description: "We believe in open communication and honest dealings.",
  },
  {
    icon: Gem,
    title: "Quality",
    description: "We never compromise on the quality of materials and work.",
  },
  {
    icon: Handshake,
    title: "Commitment",
    description: "We deliver on our promises, every single time.",
  },
  {
    icon: Sparkles,
    title: "Innovation",
    description: "We embrace modern techniques and drive to deliver better.",
  },
];

/**
 * "About Us" content, extracted so both the standalone `/about` page and the
 * Home page's one-pager section render the exact same copy and the same
 * full-bleed color-band markup — see `docs/OPEN_QUESTIONS.md` #46 for the
 * drift problem this pattern avoids. Returns sibling `<section>`s (not one
 * wrapping element) so the stats band's red background still runs edge to
 * edge in either context. `id`/`className` land on the first section only,
 * which is enough for anchor-scroll navigation to land in the right place.
 */
export function AboutSection({ id, className }: { id?: string; className?: string }) {
  return (
    <>
      <section id={id} className={cn("container grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-20", className)}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-red">Who We Are</p>
          <p className="mt-3 text-ink">
            <span className="font-semibold text-brand-red">BrickBasket</span> is a premium
            construction and real estate company delivering end-to-end building solutions with
            transparency, quality and commitment. We bridge the gap between your vision and its
            successful execution by creating exceptional value through our robust and transparent
            construction ecosystem.
          </p>
          <p className="mt-4 text-ink-muted">
            We transform ideas into exceptional spaces that inspire, empower, and stand the test
            of time. Every project is thoughtfully designed to create unique living and working
            environments that enhance the lives of their occupants.
          </p>
          <p className="mt-4 text-ink-muted">
            With a customer-first approach and a passion for excellence,{" "}
            <span className="font-semibold text-brand-red">BrickBasket</span> is committed to
            &ldquo;Crafting Buildings as a Symbol of Your Identity.&rdquo; This vision is reflected
            in every project we undertake.
          </p>
        </div>
        <ImagePlaceholder
          alt="Interior of a BrickBasket-built living space"
          src="/images/about-interior.jpg"
        />
      </section>

      <section className="bg-brand-red text-white">
        <div className="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <Icon className="mx-auto h-6 w-6 text-white/80" aria-hidden />
                <div className="mt-2 font-heading text-3xl font-extrabold">{stat.value}</div>
                <div className="mt-1 text-sm text-white/85">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container py-16 md:py-20">
        <SectionHeading eyebrow="Our Core Values" title="What Drives Us Forward" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CORE_VALUES.map((value) => {
            const Icon = value.icon;
            return (
              <div key={value.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mt-4 font-heading text-base font-semibold text-ink">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm text-ink-muted">{value.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
