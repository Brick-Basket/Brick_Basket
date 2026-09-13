import Image from "next/image";
import { cn } from "@/lib/utils/cn";

const SIZES = {
  sm: { icon: 28, text: "text-lg" },
  md: { icon: 36, text: "text-xl" },
  lg: { icon: 48, text: "text-2xl" },
} as const;

export interface LogoProps {
  /** "light" = wordmark for use on light/ivory surfaces (header). "dark" = for use on the charcoal footer/dark surfaces. */
  variant?: "light" | "dark";
  size?: keyof typeof SIZES;
  withTagline?: boolean;
  className?: string;
}

/**
 * Brand lockup: the icon asset extracted from the official Branding.pdf
 * (public/brand/icon.png) plus a live CSS text wordmark — not a flattened
 * logo image for the wordmark itself, so exact brand hex values render
 * crisply at any size/theme instead of relying on raster color fidelity.
 *
 * Note: source brand assets were only available as a PDF (raster/vector
 * flattened on export). public/brand/*.png were extracted and cleaned from
 * that PDF. Request native AI/EPS/SVG files from the designer for
 * production-grade scaling — see docs/OPEN_QUESTIONS.md.
 */
export function Logo({ variant = "light", size = "md", withTagline = false, className }: LogoProps) {
  const { icon, text } = SIZES[size];
  const basketColor = variant === "dark" ? "text-brand-ivory" : "text-brand-charcoal";

  return (
    <span className={cn("inline-flex flex-col", className)}>
      <span className="inline-flex items-center gap-2">
        <Image
          src="/brand/icon.png"
          alt="BrickBasket"
          width={icon}
          height={icon}
          className="shrink-0"
          priority
        />
        <span className={cn("font-heading font-extrabold leading-none", text)}>
          <span className="text-brand-red">Brick</span>{" "}
          <span className={basketColor}>Basket</span>
        </span>
      </span>
      {withTagline && (
        <span
          className={cn(
            "mt-1 text-[11px] font-semibold uppercase tracking-wide",
            variant === "dark" ? "text-brand-ivory" : "text-ink-muted",
          )}
        >
          Built with Transparent Trust
        </span>
      )}
    </span>
  );
}
