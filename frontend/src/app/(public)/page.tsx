import type { Metadata } from "next";
import { ServicesGrid } from "@/components/marketing/services-grid";
import { PortfolioGrid } from "@/components/marketing/portfolio-grid";
import { AboutSection } from "@/components/marketing/sections/about-section";
import { HowItWorksSection } from "@/components/marketing/sections/how-it-works-section";
import { CostEstimatorSection } from "@/components/marketing/sections/cost-estimator-section";
import { WhyUsSection } from "@/components/marketing/sections/why-us-section";
import { ComparisonSection } from "@/components/marketing/sections/comparison-section";
import { FaqSection } from "@/components/marketing/sections/faq-section";
import { ContactSection } from "@/components/marketing/sections/contact-section";
import { HeroSection } from "@/components/marketing/sections/hero-section";
import { ClosingCtaSection } from "@/components/marketing/sections/closing-cta-section";
import { TranslatedSectionHeading } from "@/components/marketing/translated-section-heading";
import { cn } from "@/lib/utils/cn";
import { CONFIRMED_PROJECTS } from "@/lib/content/public-site";

// FRONTEND IMPLEMENTATION DECISION (Hindi language pass, docs/OPEN_QUESTIONS.md
// #77): this page stays a Server Component (so `export const metadata` below
// keeps working) — the pieces that needed `useLanguage()` (the Hero, the
// Services/Projects headings, the Closing CTA) were pulled out into their
// own small client components (`HeroSection`, `TranslatedSectionHeading`,
// `ClosingCtaSection`) instead of converting this whole page to a client
// component, matching the same "shared section component" pattern already
// used for About/HowItWorks/WhyUs/Comparison/FAQ/Contact below.

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
      <HeroSection id="home" className={cn("container grid gap-10 py-14 md:grid-cols-2 md:items-center md:py-20", FRAME_GRID)} />

      {/* About */}
      <AboutSection id="about" className={FRAME_GRID} />

      {/* Services */}
      <section id="services" className={cn("container py-16 md:py-20", FRAME_BLOCK)}>
        <TranslatedSectionHeading eyebrowKey="services.eyebrow" titleKey="services.title" />
        <div className="mt-10">
          <ServicesGrid />
        </div>
      </section>

      {/* How It Works */}
      <HowItWorksSection id="how-it-works" className={FRAME_BLOCK} showHeading />

      {/* Projects */}
      <section id="projects" className={cn("bg-surface-muted py-16 md:py-20", FRAME_BLOCK)}>
        <div className="container">
          <TranslatedSectionHeading eyebrowKey="projects.eyebrow" titleKey="projects.title" />
          <div className="mt-10">
            <PortfolioGrid projects={CONFIRMED_PROJECTS} />
          </div>
        </div>
      </section>

      {/* Cost Estimator */}
      <CostEstimatorSection id="cost-estimator" className={FRAME_BLOCK} showHeading />

      {/* Why Us */}
      <WhyUsSection id="why-us" className={FRAME_BLOCK} showHeading />

      {/* The Traditional Way vs. The BrickBasket Way — see docs/CHANGELOG.md */}
      <ComparisonSection className={cn("bg-surface-muted", FRAME_BLOCK)} showHeading />

      {/* FAQ */}
      <FaqSection id="faq" className={FRAME_BLOCK} showHeading />

      {/* Contact */}
      <ContactSection id="contact" className={SCROLL_OFFSET} />

      {/* Closing CTA */}
      <ClosingCtaSection />
    </>
  );
}
