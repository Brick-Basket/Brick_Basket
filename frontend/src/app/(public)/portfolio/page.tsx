import type { Metadata } from "next";
import { PageBanner } from "@/components/marketing/page-banner";
import { PortfolioGrid } from "@/components/marketing/portfolio-grid";
import { CONFIRMED_PROJECTS } from "@/lib/content/public-site";

export const metadata: Metadata = {
  title: "Projects",
  description: "A look at BrickBasket's completed and ongoing commercial, residential and interior projects.",
};

// FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase
// 6): this page used to list 4 additional projects (Office Building —
// Ranchi, Elegant Bungalow — Gorakhpur, Retail Space — Kanpur, Hotel
// Project — Varanasi) beyond the 4 the owner has actually confirmed. None
// of those 4 appear anywhere in the owner requirements — they were
// invented placeholder content presented as real completed/ongoing work,
// which a portfolio page should never do. Removed outright rather than
// marked "pending" (unlike a pending *service*, a portfolio entry implies
// a real, deliverable project — showing a placeholder one here, even
// labeled, misrepresents completed work). See docs/OPEN_QUESTIONS.md #46.
// Now sourced from the shared `CONFIRMED_PROJECTS` list so Home and
// Portfolio can never drift apart again.

export default function PortfolioPage() {
  return (
    <>
      <PageBanner title="Our Projects" current="Projects" />
      <section className="container py-16 md:py-20">
        <PortfolioGrid projects={CONFIRMED_PROJECTS} />
      </section>
    </>
  );
}
