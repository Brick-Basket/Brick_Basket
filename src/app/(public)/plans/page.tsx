import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { PageBanner } from "@/components/marketing/page-banner";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PUBLIC_ROUTES } from "@/lib/constants/routes";
import { CONFIRMED_SERVICES } from "@/lib/content/public-site";

export const metadata: Metadata = {
  title: "Plans & Packages",
  description:
    "BrickBasket builds a tailored construction package around your land, budget and design — from finance and land purchase through construction and interiors.",
};

/**
 * No confirmed package tiers or pricing exist in the owner requirements
 * (master prompt: "Plans / Construction Packages — only where supported by
 * confirmed business information"). This page is built around the
 * already-confirmed service list instead of inventing tiers/pricing, with a
 * strong path to a custom quote via the lead-capture Contact form.
 * See docs/OPEN_QUESTIONS.md if the client supplies real package data.
 *
 * FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase
 * 6): this list used to be hand-typed with its own condensed wording (and
 * included the unconfirmed "Post Construction Support") — now built
 * directly from the shared `CONFIRMED_SERVICES` list so it can't drift
 * from the Services page again. See docs/OPEN_QUESTIONS.md #46.
 */
const PACKAGE_BUILDING_BLOCKS = CONFIRMED_SERVICES.map((s) => `${s.title} — ${s.description}`);

export default function PlansPage() {
  return (
    <>
      <PageBanner title="Plans & Packages" current="Plans" />

      <section className="container py-16 md:py-20">
        <SectionHeading
          eyebrow="Built Around You"
          title="Every Project Gets a Tailored Package"
        />
        <p className="mx-auto mt-4 max-w-2xl text-center text-ink-muted">
          Every plot, budget and design brief is different, so BrickBasket doesn&apos;t sell a
          fixed price list — we scope a package from the services below to match your project,
          then walk you through it before anything is finalized.
        </p>

        <Card className="mx-auto mt-10 max-w-2xl p-8">
          <ul className="flex flex-col gap-3">
            {PACKAGE_BUILDING_BLOCKS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-ink">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <div className="mt-10 text-center">
          <Link href={PUBLIC_ROUTES.contact} className={buttonVariants({ size: "lg" })}>
            Get a Custom Quote <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
