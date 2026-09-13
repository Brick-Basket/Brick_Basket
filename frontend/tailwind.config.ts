import type { Config } from "tailwindcss";

// All brand colors resolve to CSS variables defined in src/app/globals.css
// (stored as "R G B" triplets so opacity modifiers like bg-brand-red/10
// work correctly). Never hardcode a hex value in a component — extend this
// token set instead. Source of truth: docs/BRAND_GUIDELINES.md.
const withOpacity = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        brand: {
          red: withOpacity("--brand-red"),
          "red-dark": withOpacity("--brand-red-dark"),
          charcoal: withOpacity("--brand-charcoal"),
          ivory: withOpacity("--brand-ivory"),
          amber: withOpacity("--brand-amber"),
        },
        surface: {
          DEFAULT: withOpacity("--surface"),
          muted: withOpacity("--surface-muted"),
        },
        ink: {
          DEFAULT: withOpacity("--ink"),
          muted: withOpacity("--ink-muted"),
        },
        success: withOpacity("--color-success"),
        warning: withOpacity("--color-warning"),
        error: withOpacity("--color-error"),
        border: withOpacity("--border"),
      },
      borderRadius: {
        card: "var(--radius-card)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 8px 24px -8px rgb(0 0 0 / 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
