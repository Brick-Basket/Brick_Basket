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
        {/*
          FRONTEND FIX (Hindi text overlapping across lines — full history
          in docs/CHANGELOG.md): `leading-tight` (1.25) and `leading-normal`
          (1.5) both genuinely overlapped — Devanagari matras/conjuncts/reph
          marks need more vertical room than a Latin-tuned ratio assumes,
          especially at this heading's bold weight and large size.
          `leading-loose` (2.0, as a Tailwind class) and then an inline
          `style={{ lineHeight: 2.3 }}` were tried next; 2.3 was confirmed
          (via the English hero rendering with an obviously large gap) to
          be more space than needed — too loose.

          Settled at `lineHeight: 1.75` — between the confirmed-too-tight
          1.5 and the confirmed-too-loose 2.3. Kept as an inline `style`,
          not a Tailwind utility class, for two reasons: it sidesteps an
          earlier Tailwind JIT/cache reliability issue where `leading-loose`
          wasn't actually being applied at all, and — just as important —
          it means a value change here is a single obvious line to check
          for in the file (no risk of confusing it with another `leading-*`
          class elsewhere) if this needs tuning again.
        */}
        <h1
          className="font-heading text-4xl font-extrabold text-ink md:text-5xl"
          style={{ lineHeight: 1.75 }}
        >
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
