# Image Sourcing & Replacement Plan

**Why this doc exists**: asked to replace every image on the public site with the best possible, high-resolution photography — "better looking than JSW One Homes." This session's network is locked down (confirmed by direct test: every stock-photo host tried — Unsplash, Pexels, Pixabay, Wikimedia Commons — refused the connection at the proxy level, and the fallback path through the linked computer's own workspace failed to start when tried). So no new image file can actually be fetched or inserted *right now*. This document is the full, ready-to-execute plan for the moment either path opens back up — a person can hand this to whoever sources the photos, or paste search results straight into `public/images/`, and every code change below is copy-paste ready.

**Decisions already made** (confirmed directly, not assumed):
1. Sourcing method once unblocked: upload manually is the fallback if the network stays blocked — see "How to actually get the files in" below.
2. The 4 portfolio project photos (Commercial Complex, Luxury Villa, Modern Residence, Premium Interiors) are documented in code as real photos of BrickBasket's actual named, owner-confirmed projects, cropped from the owner's Company Profile deck — not stock. **Decision: replace them with high-quality generic stock too, but reword the surrounding labels so the site never claims a stock photo is an on-site photo of that specific named project.** The project names/locations themselves stay — those are real, owner-confirmed facts (see `docs/OPEN_QUESTIONS.md` #46) — only the implied "this is a photo of that exact site" claim goes away. Exact wording is below, ready to apply the moment real files land.

---

## Current state (audited directly)

All 7 images on the site are low-resolution relative to modern web standards, and every one renders at the same aspect ratio — `4:3` (the `ImagePlaceholder` component's default; no call site overrides it):

| File | Current resolution | Used on | Slot's max render width | Verdict |
|---|---|---|---|---|
| `hero-building.jpg` | 1272×764 | Home hero (above the fold, `priority` — this is the page's LCP image) | 50vw desktop | Undersized for a hero at 2x/retina desktop widths |
| `about-interior.jpg` | 915×408 | About section | 50vw desktop | Undersized, and not even a clean 4:3 crop today |
| `why-us-construction.jpg` | 1296×513 | Why Us section | 50vw desktop | Undersized, not a clean 4:3 crop |
| `projects/commercial-complex.jpg` | 699×672 | Portfolio grid | 25vw desktop (4-col) | Well below retina-sharp at this size |
| `projects/luxury-villa.jpg` | 699×567 | Portfolio grid | 25vw desktop | Same |
| `projects/modern-residence.jpg` | 699×567 | Portfolio grid | 25vw desktop | Same |
| `projects/premium-interiors.jpg` | 699×672 | Portfolio grid | 25vw desktop | Same |

Delivery pipeline is already correct and needs no rework: every slot goes through `next/image` (`ImagePlaceholder`, `src/components/marketing/image-placeholder.tsx`) with a `fill` + `sizes` + `object-cover` setup, so Next's built-in optimizer will automatically re-encode to WebP/AVIF and serve the right size per breakpoint — **the only thing missing is a large, sharp source file for it to optimize down from.** `next.config.ts`'s `images.remotePatterns` is intentionally empty (every image is a local `/public` asset, not a remote URL — `docs/OPEN_QUESTIONS.md` #43) — that stays true with this plan; nothing here needs a remote-image allowlist change.

---

## Target spec, per slot

Source everything at a **minimum of 2400×1800** (a clean 4:3 ratio) wherever possible — even though the largest current render width is ~50vw, sourcing well above that gives headroom for 2x/retina displays and for a future redesign that renders an image larger without needing to re-source it. Minimum acceptable if 2400×1800 isn't available: **1600×1200**. JPEG source is fine (Next re-encodes to WebP/AVIF automatically) — just make sure it's not itself a re-compressed low-quality JPEG (check for visible blocking/artifacting before using).

| Slot | File to replace | Scene/mood direction | Notes |
|---|---|---|---|
| Home hero | `public/images/hero-building.jpg` | A striking, well-lit modern Indian residential or mixed-use building exterior — the site's single most important image (LCP, first thing every visitor sees). Wide establishing shot, strong composition (rule-of-thirds, not a dead-center snapshot), warm/golden-hour or crisp-blue-sky lighting reads as more premium than flat midday light. | This is the one slot worth the most sourcing effort — it sets the entire site's first impression. Consider (needs your sign-off, it's a layout change, not just an image swap): rendering the hero at `aspect="16/9"` instead of the current `4/3` default — a wider crop reads more premium for a hero specifically. Flagging rather than changing silently. |
| About section | `public/images/about-interior.jpg` | A bright, tastefully furnished modern Indian home interior — living room or kitchen, natural light, clean lines. Avoid an overly staged/generic "real estate listing" look; something with warmth (a plant, natural wood tone, soft furnishings) reads less like stock. | Current alt text ("Interior of a BrickBasket-built living space") already implies a real BrickBasket interior even though this was never one of the 4 owner-confirmed project photos — reword this alt text at swap time too (see below), for the same honesty reason as the portfolio photos. |
| Why Us section | `public/images/why-us-construction.jpg` | An active construction site — tower crane(s), structural steelwork or an in-progress high-rise, ideally dusk/blue-hour for drama (matches the current alt text's intent). | Current alt text says "coastal high-rise" — oddly specific for what's meant to be an illustrative, non-project-specific shot. Reword to drop the invented specificity (see below) unless the new photo genuinely is coastal. |
| Portfolio — Commercial Complex | `public/images/projects/commercial-complex.jpg` | Generic modern commercial/office building exterior, daytime, clean architectural lines. | Real project: Jharsuguda, Odisha (keep the name/location text — only the photo becomes generic, see reword plan below). |
| Portfolio — Luxury Villa | `public/images/projects/luxury-villa.jpg` | Generic upscale Indian villa exterior — pool, landscaping, or a striking facade. | Real project: Vadodara, Gujarat (keep name/location). |
| Portfolio — Modern Residence | `public/images/projects/modern-residence.jpg` | Generic contemporary house exterior, clean minimal facade. | Real project: Lucknow, UP (keep name/location). |
| Portfolio — Premium Interiors | `public/images/projects/premium-interiors.jpg` | Generic high-end interior — living room or kitchen with premium finishes, distinct from the About section's interior shot (different room/angle/style so the two don't look interchangeable). | Real project: Basti, UP (keep name/location). |

---

## Licensing — the one non-negotiable rule

Whoever sources these (a person, or a future session with working network access) must use images under a license that's free for unrestricted commercial use with no attribution required — the **Unsplash License** or **Pexels License** are the two easiest to verify and are what most free stock sites of that caliber use. Concretely:

- **Do** use Unsplash, Pexels, Pixabay, or an equivalent free/commercial-license stock library.
- **Do not** copy images directly from JSW One Homes' site, any other competitor's site, or any real estate portal — those are that company's copyrighted photography, and "look better than JSW" has to mean better sourcing/composition/quality, never their actual images.
- **Do not** use an image whose license requires attribution *and* skip the attribution — if a chosen photo needs credit, either credit it (a small footer note is enough) or pick a different photo.
- **Do not** present an AI-generated image as if it were real photography of an actual building/site — for the same honesty reason driving the portfolio reword below.

## How to actually get the files in (once sourced)

1. Save the 7 replacement files locally, named exactly as the table above (same filenames — no code changes needed if the name matches).
2. Attach them to this chat (or, once the linked-computer workspace is working again, drop them straight into `E:\Brick_Basket\frontend\public\images\` / `...\public\images\projects\` — that folder is already connected to this session).
3. Say so here, and the actual swap (re-optimizing, verifying dimensions, confirming nothing regressed) takes one pass.

---

## The portfolio reword — apply together with the image swap, not before

**Important**: don't apply this wording change until the actual replacement photos are in place. Right now the 4 portfolio images genuinely are the real project photos, so relabeling them as "representative" today would be the same honesty problem in reverse — this text only becomes correct once the photo really is generic stock.

At swap time, apply all of the following together:

**1. `src/lib/content/public-site.ts`** — update the `PublicProject` interface's doc comment and remove the "not a stock/generic substitute" line above `CONFIRMED_PROJECTS` (both currently assert these are the owner's real photos, which will no longer be true):

```typescript
export interface PublicProject {
  title: string;
  location: string;
  category: "Commercial" | "Residential" | "Interior";
  /**
   * Representative stock photo — NOT a photo of this specific project.
   * The project itself (name/location/category) is real and owner-confirmed;
   * the image is illustrative only, since no approved on-site photography
   * exists for these 4 projects at production quality. See
   * docs/OPEN_QUESTIONS.md #66 and docs/IMAGE_SOURCING_PLAN.md.
   */
  image?: string;
}
```

And the comment above `CONFIRMED_PROJECTS`:

```typescript
/**
 * The only four projects the owner has actually confirmed as real,
 * publishable work (per the owner requirements screenshots). Anything
 * beyond these four is invented placeholder content and must not appear
 * on the public site presented as real — see the removed Ranchi/
 * Gorakhpur/Kanpur/Varanasi entries this pass took out of the Portfolio
 * page, docs/OPEN_QUESTIONS.md #46.
 *
 * `image` for each of these four is representative stock photography, not
 * a photo of that specific site — see docs/OPEN_QUESTIONS.md #66. The
 * project's own name/location/category are still the real, owner-confirmed
 * facts; only the picture is illustrative.
 */
```

**2. `src/components/marketing/portfolio-grid.tsx`** — the card's alt text currently reads `${project.title}, ${project.location}`, which (combined with a photorealistic building photo) implies the photo is that place. Change it to be honest about the photo without being honest *only* in invisible alt text (a sighted visitor should be able to tell too) — add a small visible caption:

```tsx
<ImagePlaceholder
  alt={`Representative image for ${project.title}, ${project.location}`}
  src={project.image}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
/>
<div className="p-4">
  <div className="flex items-start justify-between gap-2">
    <h3 className="font-heading text-sm font-semibold text-ink">{project.title}</h3>
    <Badge variant="brand">{project.category}</Badge>
  </div>
  <p className="mt-1 text-xs text-ink-muted">{project.location}</p>
  <p className="mt-1 text-[11px] italic text-ink-muted/70">Representative image</p>
</div>
```

(One line added: the small italic "Representative image" caption under the location.)

**3. `src/components/marketing/sections/about-section.tsx`** — reword the alt text so it no longer implies this specific interior is a real, identifiable BrickBasket-built space (since it never was one of the 4 owner-confirmed projects):

```tsx
<ImagePlaceholder
  alt="A modern residential interior, representative of BrickBasket's design standard"
  src="/images/about-interior.jpg"
/>
```

**4. `src/components/marketing/sections/why-us-section.tsx`** — drop the invented "coastal" specificity unless the sourced replacement genuinely is coastal:

```tsx
<ImagePlaceholder
  alt="An active construction site at dusk, with a tower crane over an in-progress high-rise"
  src="/images/why-us-construction.jpg"
/>
```

**5. `docs/OPEN_QUESTIONS.md`** — add a new entry once this executes (drafted below, ready to paste), logging the decision and pointing at this file and the CHANGELOG entry for the actual swap.

None of steps 1–4 above have been applied to the live files yet — they're written out in full here so the swap is a single, fast, careful pass instead of a decision made twice.
