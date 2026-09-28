"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";
import { renderHighlighted } from "@/lib/i18n/highlight";
import { cn } from "@/lib/utils/cn";

/**
 * Home page's closing "Let's Build..." band — pulled out of `page.tsx` for
 * the same reason as `HeroSection`: it needs `useLanguage()`, and keeping
 * the page itself a Server Component means the piece that needs it has to
 * live in its own client component. See docs/OPEN_QUESTIONS.md #77.
 */
export function ClosingCtaSection() {
  const { t } = useLanguage();

  return (
    <section className="bg-brand-red text-white">
      <div className="container flex flex-col items-center justify-between gap-6 py-12 md:flex-row">
        <div>
          <h2 className="font-heading text-2xl font-bold md:text-3xl">
            {renderHighlighted(t("closingCta.title"), "text-brand-charcoal")}
          </h2>
          <p className="mt-1 text-white/85">{t("closingCta.subtitle")}</p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link href="#contact" className={cn(buttonVariants({ size: "lg" }), "bg-white text-brand-red hover:bg-white/90")}>
            {t("closingCta.button")}
          </Link>
          <span className="inline-flex items-center gap-2 text-sm text-white/90">
            <Phone className="h-4 w-4" /> 9454516357, 8787200760
          </span>
        </div>
      </div>
    </section>
  );
}
