import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { PUBLIC_ROUTES } from "@/lib/constants/routes";
import { CONFIRMED_SERVICES, CONTACT_INFO } from "@/lib/content/public-site";

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
 */
export function SiteFooter() {
  return (
    <footer className="bg-brand-charcoal text-white/80">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div>
          <Logo variant="dark" size="md" />
          <p className="mt-3 max-w-xs text-sm text-white/60">
            Built with Transparent Trust — premium construction and real estate
            solutions.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Quick Links</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href={PUBLIC_ROUTES.home} className="hover:text-white">Home</Link></li>
            <li><Link href={PUBLIC_ROUTES.about} className="hover:text-white">About Us</Link></li>
            <li><Link href={PUBLIC_ROUTES.services} className="hover:text-white">Services</Link></li>
            <li><Link href={PUBLIC_ROUTES.howItWorks} className="hover:text-white">How It Works</Link></li>
            <li><Link href={PUBLIC_ROUTES.portfolio} className="hover:text-white">Projects</Link></li>
            <li><Link href={PUBLIC_ROUTES.faq} className="hover:text-white">FAQ</Link></li>
            <li><Link href={PUBLIC_ROUTES.contact} className="hover:text-white">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Services</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {CONFIRMED_SERVICES.map((s) => (
              <li key={s.title}>{s.title}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Contact Us</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li>Lucknow, Uttar Pradesh</li>
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
          <span>© {new Date().getFullYear()} BrickBasket. All Rights Reserved.</span>
          <div className="flex gap-4">
            <span>Privacy Policy</span>
            <span>Terms &amp; Conditions</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
