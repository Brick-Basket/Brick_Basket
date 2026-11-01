import type { Metadata, Viewport } from "next";
import { Poppins, Baloo_2, Hind } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/providers/theme-provider";
import "./globals.css";

// Secondary Font per docs/BRAND_GUIDELINES.md — confirmed body font.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

// Primary Font per docs/BRAND_GUIDELINES.md is "Super Wonder", a licensed
// display face. The client did supply a real SuperWonder-Regular.ttf
// (self-hosted briefly via next/font/local), but the owner asked to revert
// that and go back to how headings looked before — so Baloo 2 is back to
// being the actual rendered heading font again, not just a fallback. See
// docs/OPEN_QUESTIONS.md #13 and docs/CHANGELOG.md for the back-and-forth.
// (The supplied file is still sitting unused at
// src/app/fonts/SuperWonder-Regular.ttf if this gets revisited later.)
//
// FRONTEND FIX (Hindi font fallback, reported via a live-site screenshot,
// then corrected after a real `npm run dev` build error — see
// docs/CHANGELOG.md): this used to be `subsets: ["latin"]` only, so Hindi
// headings had no matching glyphs here and fell all the way through to the
// browser's plain system font. The first attempt at a fix added a separate
// "Baloo Da 2" font for Devanagari, reasoning (wrongly) that it was Baloo
// 2's Devanagari sibling — the real build immediately proved that wrong:
// `next/font/google` rejected it with "Unknown subset `devanagari` for font
// `Baloo Da 2` — Available subsets: bengali, latin, latin-ext, vietnamese".
// "Da" in that family name is Bengali, not Devanagari. Baloo 2 itself —
// already loaded right here — is the one that actually carries Devanagari
// glyphs; it just needed to be asked for. Adding `"devanagari"` below is
// the entire fix: Hindi headings now render in the exact same Baloo 2 font
// as English ones, not a lookalike substitute.
const headingFallback = Baloo_2({
  subsets: ["latin", "devanagari"],
  weight: ["600", "700", "800"],
  variable: "--font-heading-fallback",
  display: "swap",
});

// Poppins (above) has no Devanagari glyphs at all — unlike Baloo 2, there's
// no subset to add. `Hind` is this app's Devanagari body-text companion,
// chosen to visually pair with Poppins' clean, modern sans-serif feel (same
// weight set: 400/500/600/700). Inserted into `--font-sans` right after
// `--font-poppins` in globals.css, so CSS's normal per-glyph font fallback
// picks it up automatically for Devanagari characters only — English body
// text is unaffected, still resolving to Poppins exactly as before. Unlike
// the Baloo 2 situation above, this *is* a different font family standing
// in for Poppins (not a verified sibling), so it's flagged in
// docs/OPEN_QUESTIONS.md #77 for an owner/brand-team look, same as the
// rest of the Hindi pass.
const bodyDevanagari = Hind({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-devanagari",
  display: "swap",
});

// TBD — requires client confirmation: production domain. Placeholder lets
// Next resolve relative OG image URLs during local dev/preview builds.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.brickbasket.co.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BrickBasket — Building Stronger Spaces for a Better Tomorrow",
    template: "%s | BrickBasket",
  },
  description:
    "Premium construction and real estate solutions built on trust, transparency and quality.",
  openGraph: {
    type: "website",
    siteName: "BrickBasket",
    title: "BrickBasket — Building Stronger Spaces for a Better Tomorrow",
    description:
      "Premium construction and real estate solutions built on trust, transparency and quality.",
    images: [{ url: "/brand/icon-on-red.png", width: 512, height: 504, alt: "BrickBasket" }],
  },
  twitter: {
    card: "summary",
    title: "BrickBasket — Building Stronger Spaces for a Better Tomorrow",
    description:
      "Premium construction and real estate solutions built on trust, transparency and quality.",
    images: ["/brand/icon-on-red.png"],
  },
};

// FRONTEND IMPLEMENTATION DECISION (post-Part-20 fix): Next.js 14+ moved
// `themeColor` out of the `metadata` export into its own `viewport` export
// and warns ("Unsupported metadata themeColor is configured in metadata
// export") if it's left in `metadata`. Split out here — mirrors
// --brand-red; Next.js viewport config requires a literal, not a CSS var.
export const viewport: Viewport = {
  themeColor: "#e31e24",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // FRONTEND ADDITION (dark mode — see theme-provider.tsx and
    // docs/CHANGELOG.md): `suppressHydrationWarning` here is required by
    // this exact pattern, not a blanket opt-out — the inline script below
    // adds the `dark` class to this element, synchronously, before React
    // hydrates, specifically so a dark-mode visitor never sees a flash of
    // the light theme. That means the server-rendered className (never
    // includes "dark") and the real DOM at hydration time (may already
    // have it) deliberately differ on this one attribute; without this
    // prop, React would log a hydration-mismatch warning for a difference
    // that is expected and intentional, not a bug.
    <html
      lang="en"
      suppressHydrationWarning
      className={`scroll-smooth ${poppins.variable} ${headingFallback.variable} ${bodyDevanagari.variable}`}
    >
      <head>
        {/* Runs before first paint, outside React/Next's JS bundle (see
            THEME_INIT_SCRIPT's own comment for why it has to be a raw
            string here rather than an imported function) — reads the same
            `bb_theme` localStorage key ThemeProvider uses and applies the
            `dark` class immediately, so there's no flash of the wrong
            theme while React is still loading/hydrating. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
