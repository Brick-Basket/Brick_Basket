import Image from "next/image";
import { cn } from "@/lib/utils/cn";

const HEIGHTS = {
  sm: 28,
  md: 36,
  lg: 48,
} as const;

export interface LogoProps {
  /** "light" = full-color lockup, for light/ivory surfaces (header). "dark" =
   *  the same artwork with the charcoal "Basket" wordmark + tagline recolored
   *  to brand ivory, for the charcoal footer/sidebar/mobile-nav surfaces. */
  variant?: "light" | "dark";
  /** A preset ("sm"/"md"/"lg"), or an exact pixel height for cases the
   *  presets don't fit — e.g. `withTagline`'s 3-line lockup needs more
   *  height than the icon+wordmark presets were sized for, or the tagline
   *  text renders unreadably small. */
  size?: keyof typeof HEIGHTS | number;
  /** Renders the full lockup with the "Built with Transparent Trust" tagline
   *  baked into the source artwork, instead of just the icon + wordmark. */
  withTagline?: boolean;
  className?: string;
}

const ASSET = {
  light: { wordmark: "/brand/logo-wordmark-light.png", full: "/brand/logo-full-light.png" },
  dark: { wordmark: "/brand/logo-wordmark-dark.png", full: "/brand/logo-full-dark.png" },
} as const;

// Intrinsic pixel dimensions of the source PNGs — only used so next/image can
// reserve layout space (no CLS) and derive the correct aspect ratio. The
// actual on-screen size is set by the `height` style + `width: auto` below.
const DIMENSIONS = {
  wordmark: { width: 415, height: 215 },
  full: { width: 415, height: 261 },
} as const;

/**
 * Brand lockup — rendered from the real, official logo artwork (the icon,
 * the hand-lettered "Brick Basket" wordmark, and the ™ mark), extracted
 * directly from the client-supplied brand PDF at full resolution and cleaned
 * up (trimmed, transparent background) — not recreated with CSS text/webfont
 * approximations. See docs/OPEN_QUESTIONS.md #13 and docs/CHANGELOG.md for
 * provenance.
 *
 * Two images exist per surface: the icon+wordmark only (default), and the
 * full lockup with the "Built with Transparent Trust" tagline baked in
 * (`withTagline`). The "dark" variant is a pixel recolor of the exact same
 * artwork — only the charcoal "Basket"/tagline/™-outline pixels are swapped
 * to brand ivory (the red stays the real brand red) — so it stays legible on
 * the charcoal footer, sidebar and mobile-nav backgrounds instead of the
 * dark wordmark disappearing into a dark surface.
 */
export function Logo({ variant = "light", size = "md", withTagline = false, className }: LogoProps) {
  const height = typeof size === "number" ? size : HEIGHTS[size];
  const asset = withTagline ? ASSET[variant].full : ASSET[variant].wordmark;
  const { width, height: intrinsicHeight } = withTagline ? DIMENSIONS.full : DIMENSIONS.wordmark;

  return (
    <Image
      src={asset}
      alt="BrickBasket — Built with Transparent Trust"
      width={width}
      height={intrinsicHeight}
      priority
      className={cn("w-auto", className)}
      style={{ height, width: "auto" }}
    />
  );
}
