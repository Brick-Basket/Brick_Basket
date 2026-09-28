"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/marketing/image-placeholder";
import { WatchVideoButton } from "@/components/marketing/watch-video-button";
import { useLanguage } from "@/components/providers/language-provider";
import { renderHighlighted } from "@/lib/i18n/highlight";
import { INTRO_VIDEO } from "@/lib/content/public-site";

/**
 * Home page hero — pulled out of `page.tsx` into its own client component
 * so the page itself can stay a Server Component (keeping its
 * `export const metadata`) while this piece reads `useLanguage()` for the
 * bilingual title/subtitle. See docs/OPEN_QUESTIONS.md #77.
 */
export function HeroSection({ id, className }: { id?: string; className?: string }) {
  const { t } = useLanguage();

  return (
    <section id={id} className={className}>
      <div>
        <h1 className="font-heading text-4xl font-extrabold leading-tight text-ink md:text-5xl">
          {renderHighlighted(t("hero.title"))}
        </h1>
        <p className="mt-5 max-w-md text-ink-muted">{t("hero.subtitle")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="#services" className={buttonVariants({ size: "lg" })}>
            {t("hero.exploreServices")} <ArrowRight className="h-4 w-4" />
          </Link>
          <WatchVideoButton embedUrl={INTRO_VIDEO.embedUrl} label={t("hero.watchVideo")} />
        </div>
      </div>
      <ImagePlaceholder
        alt="BrickBasket project showcase"
        src="/images/hero-building.jpg"
        sizes="(max-width: 768px) 100vw, 50vw"
        priority
      />
    </section>
  );
}
