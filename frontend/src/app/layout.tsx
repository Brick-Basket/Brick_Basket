import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/providers/theme-provider";
import "./globals.css";

// SELF-HOSTED FONTS — see docs/OPEN_QUESTIONS.md #13/#50 and
// docs/CHANGELOG.md for the font history this continues. This build
// previously loaded Poppins/Baloo 2/Hind via `next/font/google`, which
// fetches font files from Google Fonts *at Vercel build time*. That build-
// time fetch started failing intermittently on Vercel (TypeError inside
// `next/font/google`'s loader — `src/app/layout.tsx` flagged by name in the
// build log — with build logs showing a `fonts.googleapis.com` network
// error; a redeploy reproduced the identical failure, so it wasn't one-off
// flakiness). Self-hosting the exact same font files via `next/font/local`
// removes that build-time network dependency entirely: the files below
// were fetched once from Google Fonts' own CDN (fonts.gstatic.com — the
// same bytes `next/font/google` would have fetched) and committed under
// `src/app/fonts/`, so the production build no longer depends on Vercel's
// build environment being able to reach Google at all.
//
// `next/font/local` has no per-file `unicodeRange`/subset option (unlike
// `next/font/google`, which auto-splits a family into latin/devanagari/etc
// woff2 files under one CSS variable). So instead of trying to replicate
// that splitting, the Devanagari variant of each font that needs one is
// loaded as its own separate `localFont()` call with its own CSS variable,
// and that variable is added into the font-family fallback chain in
// globals.css right after its Latin counterpart. CSS's ordinary per-glyph
// font-family fallback (already how `--font-sans-devanagari`/Hind worked
// before this change) then does the same job unicode-range splitting was
// doing: a Latin character renders in the Latin face, a Devanagari
// character falls through to the Devanagari face — visually identical
// output, just composed via two font-family entries instead of one family
// with multiple unicode-range'd @font-face rules.

// Secondary Font per docs/BRAND_GUIDELINES.md — confirmed body font.
// Poppins has no Devanagari glyphs in any of its own font files, so (as
// before this change) it only ever needed the Latin weights — Hind
// (below) is what covers Devanagari body text.
const poppins = localFont({
  src: [
    { path: "./fonts/Poppins-400-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Poppins-500-latin.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Poppins-600-latin.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Poppins-700-latin.woff2", weight: "700", style: "normal" },
  ],
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
// Baloo 2 is distributed by Google Fonts as a single variable font file
// per script (one file whose `wght` axis covers the whole weight range,
// rather than a separate static file per weight) — confirmed by fetching
// the family's own css2 response, where the weight-600/700/800 `@font-face`
// entries for a given subset all pointed at the exact same file. So one
// variable-font file per subset below covers all three heading weights.
//
// `headingFallback` carries the Latin glyphs (the actual rendered heading
// font for English text). `headingFallbackDevanagari` carries the
// Devanagari glyphs for Hindi headings — previously the same `Baloo_2`
// google-font call with `subsets: ["latin", "devanagari"]`; see this
// file's top-of-file comment for why that's now two separate localFont
// calls joined via the `--font-heading` fallback chain in globals.css
// instead of one family with unicode-range splitting.
const headingFallback = localFont({
  src: "./fonts/Baloo2-Latin-var.woff2",
  weight: "600 800",
  style: "normal",
  variable: "--font-heading-fallback",
  display: "swap",
});
const headingFallbackDevanagari = localFont({
  src: "./fonts/Baloo2-Devanagari-var.woff2",
  weight: "600 800",
  style: "normal",
  variable: "--font-heading-fallback-devanagari",
  display: "swap",
});

// Poppins (above) has no Devanagari glyphs at all — unlike Baloo 2, there's
// no subset to add. `Hind` is this app's Devanagari body-text companion,
// chosen to visually pair with Poppins' clean, modern sans-serif feel (same
// weight set: 400/500/600/700). Unlike Baloo 2, Hind ships one static file
// per weight (not a variable font), so each weight needs its own file here,
// same as Poppins above. Inserted into `--font-sans` right after
// `--font-poppins` in globals.css, so CSS's normal per-glyph font fallback
// picks it up automatically for Devanagari characters only — English body
// text is unaffected, still resolving to Poppins exactly as before. Unlike
// the Baloo 2 situation above, this *is* a different font family standing
// in for Poppins (not a verified sibling), so it's flagged in
// docs/OPEN_QUESTIONS.md #77 for an owner/brand-team look, same as the
// rest of the Hindi pass.
const bodyDevanagari = localFont({
  src: [
    { path: "./fonts/Hind-400-devanagari.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Hind-500-devanagari.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Hind-600-devanagari.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Hind-700-devanagari.woff2", weight: "700", style: "normal" },
  ],
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
      className={`scroll-smooth ${poppins.variable} ${headingFallback.variable} ${headingFallbackDevanagari.variable} ${bodyDevanagari.variable}`}
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
