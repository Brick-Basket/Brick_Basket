"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { PUBLIC_ROUTES } from "@/lib/constants/routes";
import { CONFIRMED_SERVICES, CONTACT_INFO } from "@/lib/content/public-site";
import { useLanguage } from "@/components/providers/language-provider";
import { localize, SERVICE_TITLE_HI } from "@/lib/i18n/translations";

/**
 * Public-site footer.
 *
 * FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase
 * 6/8): contact details now come from the shared `CONTACT_INFO` (matching
 * the Contact page exactly, as real `tel:`/`mailto:` links), and the
 * services list is generated from `CONFIRMED_SERVICES` instead of a
 * separately hand-typed, already-drifted 5-item list. The Facebook/
 * Instagram/LinkedIn icons that used to link to `href="#"` were removed —
 * no confirmed social URLs exist in the owner requirements; add them back
 * with real URLs once confirmed. See docs/OPEN_QUESTIONS.md #46.
 *
 * FRONTEND IMPLEMENTATION DECISION (real tagline artwork, not re-typed
 * text): this used to render the icon+wordmark `Logo` plus a separate
 * hand-typed paragraph starting "Built with Transparent Trust" — plain
 * white/60 text with none of the actual tagline's styling (the gray italic
 * treatment flanked by two short red rules, baked into the official
 * artwork). Switched to `withTagline` so the real tagline image renders
 * pixel-for-pixel as designed; `size={72}` (rather than one of the
 * icon+wordmark presets) because the 3-line lockup needs more height before
 * that third line is legible. The paragraph below now only carries the
 * extra descriptive clause that isn't part of the actual tagline.
 */
export function SiteFooter() {
  const { lang, t } = useLanguage();

  return (
    <footer className="bg-brand-charcoal text-white/80">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div>
          <Logo variant="dark" size={72} withTagline />
          <p className="mt-3 max-w-xs text-sm text-white/60">{t("footer.tagline")}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">{t("footer.quickLinks")}</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href={PUBLIC_ROUTES.home} className="hover:text-white">{t("nav.home")}</Link></li>
            <li><Link href={PUBLIC_ROUTES.about} className="hover:text-white">{t("nav.about")}</Link></li>
            <li><Link href={PUBLIC_ROUTES.services} className="hover:text-white">{t("nav.services")}</Link></li>
            <li><Link href={PUBLIC_ROUTES.howItWorks} className="hover:text-white">{t("nav.howItWorks")}</Link></li>
            <li><Link href={PUBLIC_ROUTES.plans} className="hover:text-white">{t("footer.plansPackages")}</Link></li>
            <li><Link href="/#cost-estimator" className="hover:text-white">{t("nav.costEstimator")}</Link></li>
            <li><Link href={PUBLIC_ROUTES.portfolio} className="hover:text-white">{t("nav.projects")}</Link></li>
            <li><Link href={PUBLIC_ROUTES.faq} className="hover:text-white">{t("nav.faq")}</Link></li>
            <li><Link href={PUBLIC_ROUTES.contact} className="hover:text-white">{t("nav.contact")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">{t("footer.servicesHeading")}</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {CONFIRMED_SERVICES.map((s) => (
              <li key={s.title}>{localize(lang, s.title, SERVICE_TITLE_HI)}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">{t("footer.contactUs")}</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li>{t("footer.location")}</li>
            <li>
              <a href={`mailto:${CONTACT_INFO.email}`} className="hover:text-white">
                {CONTACT_INFO.email}
              </a>
            </li>
            <li>
              <a href={`https://${CONTACT_INFO.website}`} className="hover:text-white">
                {CONTACT_INFO.website}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-4 text-xs text-white/50 md:flex-row">
          <span>© {new Date().getFullYear()} BrickBasket. {t("footer.rights")}</span>
          <div className="flex gap-4">
            <span>{t("footer.privacy")}</span>
            <span>{t("footer.terms")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
