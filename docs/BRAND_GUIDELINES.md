# Brand Guidelines → Frontend Tokens

Source: the client-supplied **`Branding.pdf`** brand guide. This file maps every confirmed brand fact from that PDF onto the frontend's design tokens — nothing here is a frontend estimate unless explicitly marked as such.

## Logo

Primary mark: a red "b" icon (the crossbar reads as a stacked brick course) + the "Brick Basket" wordmark + the tagline "Built with Transparent Trust." Assets extracted from the PDF and cleaned (background removed, autocropped) live in:

- `public/brand/icon.png` — icon only, transparent background. Used for App Icons, Favicons, Profile Pictures, Watermarks per the guide, and for the compact `Logo` component (`src/components/brand/logo.tsx`) used in the header/footer.
- `public/brand/icon-on-red.png` — icon in ivory on a red rounded card. Used for social/app-icon contexts; also the source for `src/app/icon.png` (favicon) and `src/app/apple-icon.png` (Next.js App Router auto-picks these up — no metadata code needed).
- `public/brand/logo-full-color.png`, `public/brand/logo-lockup.png` — full wordmark and wordmark+tagline lockups, kept as reference assets.

**The header/footer wordmark is *not* rendered from these raster images.** `src/components/brand/logo.tsx` renders the icon image plus a live CSS text wordmark in the exact brand hex values, so it stays crisp at any size and themeable (light wordmark for the header, ivory-on-charcoal for the footer) instead of depending on raster color fidelity.

**Open item:** these assets are raster, extracted from a flattened PDF export — there is no vector source in hand. Request native AI/EPS/SVG logo files from the designer for production-grade scaling (crisp above ~2x the current raster resolution). Tracked in `docs/OPEN_QUESTIONS.md`.

### Logo usage rules (from the guide)

- Clear space: maintain space around the logo equal to the height of one "brick" element inside the symbol on every side.
- Minimum size: 25mm width (print), 120px width (digital).
- Preferred website placement: top left (implemented — header logo is top-left across all breakpoints).
- Social profile picture: icon-only logo.
- Don't: recolor the icon (e.g. green), distort/stretch it, or otherwise deviate from the approved variations (Full Color / White / Single Color).

## Color palette

| Token | Hex | RGB | Use for | Share |
|---|---|---|---|---|
| Brick Red (Primary) — `brand-red` | `#E31E24` | 227 30 36 | Logo symbol, buttons, CTAs, highlights, icons, accents | 60% |
| Warm Ivory — `brand-ivory` | `#FEF2E9` | 254 242 233 | Primary page background (confirmed: *"Use Warm Ivory as the primary background color to ensure clarity and focus"*) | 25% |
| Charcoal Brown (Secondary) — `brand-charcoal` | `#463C3B` | 70 60 59 | Headlines, body text, footer areas, supporting elements | 15% |

Implemented as CSS variable **RGB triplets** in `src/app/globals.css` (`--brand-red: 227 30 36;` etc.) and consumed in `tailwind.config.ts` via `rgb(var(--x) / <alpha-value>)`, so Tailwind opacity modifiers (`bg-brand-red/10`) work correctly — a plain hex CSS variable can't be given a Tailwind alpha at build time.

`--brand-red-dark: #B5181D` is a frontend-derived hover/active shade (not in the source guide, needed for interactive states) — flagged as such in code comments.

### Background pattern system (documented, not yet implemented in a component)

- Light background pattern: base `#FEF2E9`, pattern color `#E31E24`, opacity 8–10%. For light backgrounds, subtle texture in layouts/presentations/stationery.
- Red background pattern: base `#E31E24`, pattern color `#FFFFFF`, opacity 8–10%. For banners, hero sections, social/promotional materials.
- Guideline: keep patterns subtle, low opacity, large-scale elements, breathing space around content. Don't use highly detailed patterns, reduce logo visibility, or stack multiple pattern styles. **Not yet built** — candidate for the Part 2 public-site hero/banner treatment.

## Typography

- **Primary Font — "Super Wonder"** (logo wordmark, headlines, campaign titles, hero banners, promotional creatives). This is a licensed display font, not available through Google Fonts/`next/font`. **Open item:** request the licensed font files (or a webfont license) from the client so headings render in the real brand typeface. Tracked in `docs/OPEN_QUESTIONS.md`.
  - **Interim fallback (frontend decision, not a brand fact):** `Baloo 2` via `next/font/google`, weights 600/700/800 — a free, similarly bold/rounded/friendly geometric display face. Wired as `--font-heading-fallback` → `font-heading` in `tailwind.config.ts`. Swapping in the real font later is a one-file change in `src/app/layout.tsx`.
- **Secondary Font — "Poppins"** (body copy, taglines, website content, presentations, brochures, social media) — confirmed and loaded for real via `next/font/google`, weights 400/500/600/700.

## Brand personality (for copywriting/voice, Part 2+)

Transparent · Reliable · Modern · Professional · Efficient · Customer First · Reliability · Quality Assurance · Long-Term Relationships.
