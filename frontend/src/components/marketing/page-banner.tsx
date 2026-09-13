import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PUBLIC_ROUTES } from "@/lib/constants/routes";

/**
 * The red interior-page banner used across About/Services/Why Us/
 * Portfolio/Contact/FAQ/How It Works/Plans, matching the approved UI
 * references: solid Brick Red band, a subtle white line-art texture per the
 * brand guide's "Red Background Pattern" (base #E31E24, pattern #FFFFFF,
 * opacity 8–10%), a page title, and a Home ▸ Current breadcrumb.
 */
export function PageBanner({ title, current }: { title: string; current: string }) {
  return (
    <section className="relative overflow-hidden bg-brand-red text-white">
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-10"
        viewBox="0 0 400 200"
        preserveAspectRatio="xMaxYMid slice"
      >
        <g stroke="#FFFFFF" strokeWidth="1.5" fill="none">
          <rect x="230" y="40" width="60" height="120" />
          <rect x="230" y="40" width="60" height="20" />
          <rect x="230" y="80" width="60" height="20" />
          <rect x="230" y="120" width="60" height="20" />
          <rect x="300" y="70" width="40" height="90" />
          <rect x="300" y="70" width="40" height="18" />
          <rect x="300" y="106" width="40" height="18" />
          <rect x="300" y="142" width="40" height="18" />
          <line x1="200" y1="160" x2="360" y2="160" />
        </g>
      </svg>
      <div className="container relative py-12 md:py-16">
        <h1 className="font-heading text-3xl font-extrabold md:text-4xl">{title}</h1>
        <nav aria-label="Breadcrumb" className="mt-3 flex items-center gap-1.5 text-sm text-white/80">
          <Link href={PUBLIC_ROUTES.home} className="hover:text-white">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <span className="text-white">{current}</span>
        </nav>
      </div>
    </section>
  );
}
