import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/marketing/image-placeholder";
import { SectionHeading } from "@/components/marketing/section-heading";
import { ServicesGrid } from "@/components/marketing/services-grid";
import { PortfolioGrid } from "@/components/marketing/portfolio-grid";
import { WatchVideoButton } from "@/components/marketing/watch-video-button";
import { AboutSection } from "@/components/marketing/sections/about-section";
import { HowItWorksSection } from "@/components/marketing/sections/how-it-works-section";
import { WhyUsSection } from "@/components/marketing/sections/why-us-section";
import { FaqSection } from "@/components/marketing/sections/faq-section";
import { ContactSection } from "@/components/marketing/sections/contact-section";
import { cn } from "@/lib/utils/cn";
import { CONFIRMED_SERVICES, CONFIRMED_PROJECTS, INTRO_VIDEO } from "@/lib/content/public-site";

export const metadata: Metadata = {
  title: "Home",
  description:
    "BrickBasket delivers end-to-end construction and real estate solutions — project finance, land purchase, Vaastu, design and build — with transparency and quality at every step.",
};

// FRONTEND IMPLEMENTATION DECISION (one-page site pass): the Home page is
// now a full one-pager — every nav section (About, Services, How It Works,
// Projects, Why Us, FAQ, Contact) is stacked here in order behind its own
// anchor `id`, and the header's nav links smooth-scroll to these instead of
// navigating away. The standalone /about, /services, /how-it-works,
// /portfolio, /why-us, /faq, /contact routes stay live (direct links, SEO,
// footer) and render the exact same shared section components, so content
// can never drift between the two presentations — see
// docs/OPEN_QUESTIONS.md #46.
//
// FRONTEND IMPLEMENTATION DECISION (How It Works added to the one-pager):
// `/how-it-works` was a real, fully-built page with no link anywhere in the
// site's navigation — not in MAIN_NAV, not in the footer — reachable only
// via the hero's old "Watch Video" button, which now opens a real video
// instead (see below). Rather than leave it orphaned once that link was
// gone, it's now a proper section here too (`HowItWorksSection`, added to
// `MAIN_NAV` and the footer's Quick Links), placed right after Services —
// "what we do, then how we do it" — and before Projects, which shows that
// process's results.
//
// FRONTEND IMPLEMENTATION DECISION (section-framing pass): a short section
// (e.g. Home's own hero, or Featured Projects on a tall screen) used to fall
// short of the viewport, letting the next section's heading peek in at the
// bottom the instant you landed on the anchor above it — inconsistent from
// section to section and read as a layout bug. Every anchored section below
// now also reserves at least one full viewport, minus the sticky header's
// own height (`min-h-[calc(100vh_-_4rem)]`), so navigating to any nav-bar
// anchor always shows that section filling the screen on its own. A section
// whose real content is taller than one screen (a long FAQ list, e.g.) still
// scrolls normally past that floor — this only stops a short section from
// coming up short, never truncates a tall one.
//
// Two variants, because these sections lay out their own top-level element
// differently: FRAME_GRID centers content via CSS Grid's own
// `align-content` (for a section whose outer element is itself `grid` —
// Hero/About/Contact); FRAME_BLOCK uses `flex flex-col justify-center` (for
// a section whose outer element is a plain block wrapping a heading + inner
// grid — Services/Projects/Why Us/FAQ). Passed only here, on the one-pager:
// the standalone /about, /why-us, /faq, /contact routes render the exact
// same shared components without either class (see each one's own
// `page.tsx`), so their shorter, PageBanner-topped layout is unaffected.
// Contact is deliberately excluded from this full-frame treatment (gets
// just SCROLL_OFFSET below) — it's the last nav anchor, so there's no next
// nav-section heading to hide, and forcing a full-viewport height there
// only centered its shorter content and left a dead gap under the form.
//
// FRONTEND IMPLEMENTATION DECISION ("Watch Video" — real video wired in):
// this button originally said "Watch Video" but linked to /how-it-works
// with no real video behind it anywhere in the project; briefly relabeled
// "How It Works" to stop misleading visitors (see docs/CHANGELOG.md). The
// owner has since supplied a real explainer video, so the button is back
// to "Watch Video" and now opens it in an in-page modal — see
// `WatchVideoButton` (src/components/marketing/watch-video-button.tsx) and
// `INTRO_VIDEO` (src/lib/content/public-site.ts) for the embed details and
// the Google Drive sharing-permission caveat.
const SCROLL_OFFSET = "scroll-mt-16";
const FRAME_GRID = cn(SCROLL_OFFSET, "min-h-[calc(100vh_-_4rem)] content-center");
const FRAME_BLOCK = cn(SCROLL_OFFSET, "flex min-h-[calc(100vh_-_4rem)] flex-col justify-center");

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section id="home" className={cn("container grid gap-10 py-14 md:grid-cols-2 md:items-center md:py-20", FRAME_GRID)}>
        <div>
          <h1 className="font-heading text-4xl font-extrabold leading-tight text-ink md:text-5xl">
            Building <span className="text-brand-red">Stronger Spaces</span> for a Better
            Tomorrow
          </h1>
          <p className="mt-5 max-w-md text-ink-muted">
            Premium construction and real estate solutions built on trust, transparency and
            quality.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#services" className={buttonVariants({ size: "lg" })}>
              Explore Services <ArrowRight className="h-4 w-4" />
            </Link>
            <WatchVideoButton embedUrl={INTRO_VIDEO.embedUrl} />
          </div>
        </div>
        <ImagePlaceholder
          alt="BrickBasket project showcase"
          src="/images/hero-building.jpg"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </section>

      {/* About */}
      <AboutSection id="about" className={FRAME_GRID} />

      {/* Services */}
      <section id="services" className={cn("container py-16 md:py-20", FRAME_BLOCK)}>
        <SectionHeading
          eyebrow="Our Services"
          title={
            <>
              Comprehensive <span className="text-brand-red">Solutions</span> for Every Need
            </>
          }
        />
        <div className="mt-10">
          <ServicesGrid services={CONFIRMED_SERVICES} />
        </div>
      </section>

      {/* How It Works */}
      <HowItWorksSection
        id="how-it-works"
        className={FRAME_BLOCK}
        heading={{ eyebrow: "Our Process", title: "From Idea to Handover" }}
      />

      {/* Projects */}
      <section id="projects" className={cn("bg-surface-muted py-16 md:py-20", FRAME_BLOCK)}>
        <div className="container">
          <SectionHeading eyebrow="Our Work" title="Featured Projects" />
          <div className="mt-10">
            <PortfolioGrid projects={CONFIRMED_PROJECTS} />
          </div>
        </div>
      </section>

      {/* Why Us */}
      <WhyUsSection
        id="why-us"
        className={FRAME_BLOCK}
        heading={{
          eyebrow: "Why BrickBasket",
          title: "Why Choose BrickBasket?",
        }}
      />

      {/* FAQ */}
      <FaqSection
        id="faq"
        className={FRAME_BLOCK}
        heading={{
          eyebrow: "Got Questions?",
          title: "Frequently Asked Questions",
        }}
      />

      {/* Contact */}
      <ContactSection id="contact" className={SCROLL_OFFSET} />

      {/* Closing CTA */}
      <section className="bg-brand-red text-white">
        <div className="container flex flex-col items-center justify-between gap-6 py-12 md:flex-row">
          <div>
            <h2 className="font-heading text-2xl font-bold md:text-3xl">
              Let&apos;s Build The Best In Class Together
            </h2>
            <p className="mt-1 text-white/85">Ready to start your next project?</p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="#contact"
              className={cn(buttonVariants({ size: "lg" }), "bg-white text-brand-red hover:bg-white/90")}
            >
              Get Consultation Now
            </Link>
            <span className="inline-flex items-center gap-2 text-sm text-white/90">
              <Phone className="h-4 w-4" /> 9454516357, 8787200760
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
