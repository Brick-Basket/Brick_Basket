import type { Metadata, Viewport } from "next";
import { Poppins, Baloo_2 } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
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
const headingFallback = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading-fallback",
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
    <html
      lang="en"
      className={`scroll-smooth ${poppins.variable} ${headingFallback.variable}`}
    >
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
