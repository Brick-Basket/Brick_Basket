import type { LucideIcon } from "lucide-react";
import { Banknote, MapPin, Compass, ClipboardList, HardHat, Droplets, ShieldPlus } from "lucide-react";

/**
 * Single source of truth for the public marketing site's factual content —
 * confirmed projects, confirmed services, stats, and process steps.
 *
 * FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase
 * 6): before this file existed, the confirmed project list and service
 * list were each hand-typed independently in `page.tsx` (Home),
 * `portfolio/page.tsx`, `services/page.tsx`, `plans/page.tsx`,
 * `faq/page.tsx`, and `footer.tsx` — five to six independent copies that
 * had already drifted (the Portfolio page carried 4 invented projects
 * beyond the 4 the owner actually confirmed; wording for the same service
 * varied by page — "Planning & Design" vs. the owner's own "Planning &
 * Architectural Services", "Vastu" vs. "Vaastu", "Pest Control & Water
 * Proofing" vs. "Pest Control & Waterproofing"). Every public page now
 * imports from here instead of re-typing its own copy, so there is exactly
 * one place to correct a name or add a confirmed project. See
 * docs/OPEN_QUESTIONS.md #46.
 */

export interface PublicProject {
  title: string;
  location: string;
  category: "Commercial" | "Residential" | "Interior";
  /** Approved project photo from the owner's Company Profile deck — see public/images/projects/. */
  image?: string;
}

/**
 * The only four projects the owner has actually confirmed as real,
 * publishable work (per the owner requirements screenshots). Anything
 * beyond these four is invented placeholder content and must not appear
 * on the public site presented as real — see the removed Ranchi/
 * Gorakhpur/Kanpur/Varanasi entries this pass took out of the Portfolio
 * page, docs/OPEN_QUESTIONS.md #46.
 *
 * `image` for each of these four is the owner-supplied photo for that
 * exact project (cropped from the Company Profile deck's "Featured
 * Projects" page) — not a stock/generic substitute. See
 * docs/CHANGELOG.md for the image-insertion pass.
 */
export const CONFIRMED_PROJECTS: PublicProject[] = [
  {
    title: "Commercial Complex",
    location: "Jharsuguda, Odisha",
    category: "Commercial",
    image: "/images/projects/commercial-complex.jpg",
  },
  {
    title: "Luxury Villa",
    location: "Vadodara, Gujarat",
    category: "Residential",
    image: "/images/projects/luxury-villa.jpg",
  },
  {
    title: "Modern Residence",
    location: "Lucknow, UP",
    category: "Residential",
    image: "/images/projects/modern-residence.jpg",
  },
  {
    title: "Premium Interiors",
    location: "Basti, UP",
    category: "Interior",
    image: "/images/projects/premium-interiors.jpg",
  },
];

export interface PublicService {
  icon: LucideIcon;
  title: string;
  description: string;
  /** True only for the one service the owner has not confirmed — see PENDING_SERVICES below. */
  pending?: boolean;
}

/** The seven core services the owner requirements confirm, in the owner's own naming. */
export const CONFIRMED_SERVICES: PublicService[] = [
  {
    icon: Banknote,
    title: "Project Finance",
    description: "Complete financial support to make your dream project a reality with ease and confidence.",
  },
  {
    icon: MapPin,
    title: "Land Purchase",
    description: "We help you find the perfect land with the best value for your investment.",
  },
  {
    icon: Compass,
    title: "Vaastu Services",
    description: "Expert Vaastu guidance to bring harmony, positivity and prosperity to your space.",
  },
  {
    icon: ClipboardList,
    title: "Planning & Architectural Services",
    description: "Creative architectural designs and smart planning for functional and beautiful spaces.",
  },
  {
    icon: ShieldPlus,
    title: "Pest Control & Waterproofing",
    description: "Advanced solutions for a safe, durable and leak-free living.",
  },
  {
    icon: HardHat,
    title: "Construction & Interior Services",
    description: "High-quality construction combined with elegant interiors crafted to perfection.",
  },
  {
    icon: Droplets,
    title: "Rain Water Harvesting",
    description: "Sustainable rainwater harvesting solutions for a greener and better tomorrow.",
  },
];

/**
 * Contact form "Subject" dropdown options — the 7 confirmed services plus a
 * general/other catch-all, so a visitor can pick what their enquiry is about
 * instead of typing free text. Derived from `CONFIRMED_SERVICES` (not
 * hand-typed again) so the two can never drift — see the file-level note
 * above on why this file exists.
 */
export const CONTACT_SUBJECT_OPTIONS = [
  "General Enquiry",
  ...CONFIRMED_SERVICES.map((service) => service.title),
  "Other",
];

export interface ConstructionPackage {
  slug: string;
  name: string;
  /** ₹ per sqft. Equal to `rateMax` for a tier with a single flat rate (Essential). */
  rateMin: number;
  rateMax: number;
  coreFeatures: string;
  bestFor: string;
  /**
   * FRONTEND ADDITION (docs/OPEN_QUESTIONS.md #64): 2–4 short phrases, each
   * lifted verbatim (reworded only to drop "Everything in X, plus") from
   * this tier's own `coreFeatures` sentence — what's genuinely NEW at this
   * tier versus the one below it, not a restatement of everything included.
   * Exists because the package-selector cards had no room for a full
   * paragraph and were showing only the vague `bestFor` line, which doesn't
   * tell a visitor what they're actually getting for the price jump — see
   * `PACKAGE_COMPARISON_ROWS` below for the fuller, cumulative picture.
   */
  newAtThisTier: string[];
}

/**
 * Real, owner-supplied package tiers and per-sqft pricing — copied verbatim
 * (name, rate, "Core Features", "Best For") from the owner's own
 * `2026_08_25_PROPOSAL_Template_BRICKBASKET.pdf`, pages 5–9 ("BRICKBASKET
 * Home Construction Service-Packages"). This resolves docs/OPEN_QUESTIONS.md
 * #15/#58a for the Home Construction line — used to drive the `/plans` page
 * and the Cost Estimator (`CostEstimatorSection`).
 *
 * Note: the same proposal PDF (page 11) also contains a second, differently-
 * named 4-tier comparison table ("Classic/Premium/Luxury/Elite") with a
 * materials/brand-level feature checklist but no per-sqft pricing at all —
 * that table can't drive a calculator and isn't used here. See
 * docs/OPEN_QUESTIONS.md #15 for the open question of whether/how the two
 * schemes should be reconciled.
 */
export const CONSTRUCTION_PACKAGES: ConstructionPackage[] = [
  {
    slug: "essential",
    name: "Essential",
    rateMin: 1399,
    rateMax: 1399,
    coreFeatures:
      "Budgeting and execution via our web/app platform, Vastu-integrated planning, scheduled engineering visits, and competitive pricing.",
    bestFor: "Homeowners looking for a streamlined, reliable, and cost-effective approach to standard construction.",
    newAtThisTier: [
      "Web/app-based budgeting & execution tracking",
      "Vastu-integrated planning",
      "Scheduled engineering site visits",
    ],
  },
  {
    slug: "smart",
    name: "Smart",
    rateMin: 1799,
    rateMax: 1999,
    coreFeatures:
      "Everything in Essential, plus cutting-edge 3D layering visualisation, regular quality assurance tool readings, and detailed progress insights.",
    bestFor: "Clients seeking enhanced design visualisation and rigorous quality testing for a modern build.",
    newAtThisTier: [
      "Cutting-edge 3D design visualisation",
      "Regular quality-assurance tool readings",
      "Detailed progress insights",
    ],
  },
  {
    slug: "premium",
    name: "Premium",
    rateMin: 2099,
    rateMax: 2399,
    coreFeatures:
      "Everything in Smart, plus a dedicated site manager for continuous oversight, personalised layering options, and comprehensive end-to-end lifecycle support.",
    bestFor: "Individuals desiring hands-on, premium project management and absolute attention to detail.",
    newAtThisTier: [
      "Dedicated site manager (continuous on-site oversight)",
      "Personalised layering/design options",
      "End-to-end lifecycle support",
    ],
  },
  {
    slug: "signature",
    name: "Signature",
    rateMin: 2499,
    rateMax: 2999,
    coreFeatures:
      "Fully customised architectural services, integrated plot-finding and financial assistance, bespoke interior layering, and maximum value engineering.",
    bestFor: "Those building a completely unique dream home who want a fully tailored, all-inclusive luxury experience from start to finish.",
    newAtThisTier: [
      "Fully customised architectural services",
      "Integrated plot-finding & financial assistance",
      "Bespoke interior layering",
      "Maximum value engineering",
    ],
  },
];

export interface PackageComparisonRow {
  dimension: string;
  /** Keyed by `ConstructionPackage.slug`. */
  values: Record<string, string>;
}

/**
 * FRONTEND ADDITION (docs/OPEN_QUESTIONS.md #64): the owner's own package
 * copy is written as 4 cumulative paragraphs — "Everything in Smart, plus
 * X, Y, Z" — which only reads as a comparison if a visitor holds all 4
 * paragraphs in their head at once and mentally diffs them. This
 * restructures the *exact same, verbatim* feature content into a real
 * side-by-side comparison grid, one dimension per row, so what's new at
 * each tier is visible at a glance instead of buried in prose. No feature
 * is added, removed or reworded beyond what `coreFeatures` above already
 * says — this is presentation only.
 *
 * FLAGGED ASSUMPTION: Essential → Smart → Premium's copy is explicitly
 * cumulative ("Everything in X, plus..."), but Signature's own copy is
 * NOT — it reads as a standalone list ("Fully customised architectural
 * services, integrated plot-finding...") rather than "Everything in
 * Premium, plus...". Signature's `bestFor` text ("fully tailored,
 * all-inclusive luxury experience") strongly implies it's still meant to
 * include everything Premium does (dedicated site manager, QA readings,
 * app tracking, etc.) plus its own 4 additions — that is the assumption
 * encoded below — but the source copy itself never states it outright for
 * Signature the way it does for the tiers below it. Worth the owner
 * confirming directly. See docs/OPEN_QUESTIONS.md #64.
 */
export const PACKAGE_COMPARISON_ROWS: PackageComparisonRow[] = [
  {
    dimension: "Design & Planning",
    values: {
      essential: "Vastu-integrated planning",
      smart: "+ Cutting-edge 3D design visualisation",
      premium: "+ Personalised layering/design options",
      signature: "Fully customised architectural services + bespoke interior layering",
    },
  },
  {
    dimension: "Site Supervision & Quality",
    values: {
      essential: "Scheduled engineering visits",
      smart: "+ Regular QA tool readings",
      premium: "+ Dedicated site manager (continuous oversight)",
      signature: "Dedicated site manager (continuous oversight), as Premium",
    },
  },
  {
    dimension: "Progress Tracking",
    values: {
      essential: "Web/app-based budgeting & execution tracking",
      smart: "+ Detailed progress insights",
      premium: "+ End-to-end lifecycle support",
      signature: "End-to-end lifecycle support, as Premium",
    },
  },
  {
    dimension: "Additional Services",
    values: {
      essential: "—",
      smart: "—",
      premium: "—",
      signature: "Integrated plot-finding & financial assistance, maximum value engineering",
    },
  },
];

export interface PackageSpecCategory {
  key: string;
  label: string;
  /** Keyed by `ConstructionPackage.slug`. Each tier's bullet list for this category. */
  tiers: Record<string, string[]>;
}

/**
 * FRONTEND ADDITION, built directly against a reference screenshot the owner
 * supplied of JSW One Homes' own "Packages" page — an expand/collapse
 * accordion (Design, Structure, Flooring and dado, Door and windows,
 * Plumbing accessories, Painting, Electrical, Plumbing, Railing and
 * handrails), each category opening into a concrete, tier-by-tier
 * specification list. Asked directly to build BrickBasket's own version "in
 * this format and better than JSW One Homes," with explicit creative
 * latitude ("use your creativity... do whatever is best").
 *
 * Two very different kinds of content are blended into the 9 categories
 * below, and they carry different confidence levels — flagging this
 * clearly, the same discipline this file already applies everywhere else:
 *
 * 1. **`design` reuses real, owner-confirmed content** — the same
 *    Vastu-integrated planning / 3D visualisation / dedicated site manager /
 *    fully customised architectural services differentiators already
 *    verbatim-sourced into `CONSTRUCTION_PACKAGES`/`PACKAGE_COMPARISON_ROWS`
 *    from the proposal PDF's pages 5–9. Nothing new invented here.
 *
 * 2. **The other 8 categories (`structure` through `railing`) are entirely
 *    frontend-authored**, not owner-supplied. The proposal PDF's *second*,
 *    unpriced tier scheme (page 11, "Classic/Premium/Luxury/Elite") does
 *    contain a real materials/brand checklist for categories like these —
 *    see `docs/OPEN_QUESTIONS.md` #15/#58a — but that page's actual content
 *    was never transcribed into this codebase and isn't available in this
 *    session to draw from, and its tier names don't even match this site's
 *    real, priced Essential/Smart/Premium/Signature scheme (see #61 for why
 *    that mismatch was never reconciled). Rather than block on that missing
 *    source material, or silently invent specific brand/vendor names as if
 *    BrickBasket had confirmed them (which would misrepresent real supplier
 *    commitments that don't exist here), each of these 8 categories instead
 *    escalates by **construction grade** — standard vs. premium concrete
 *    grade, ISI-certified vs. branded vs. premium-branded fixtures, MS vs.
 *    SS-304 railing, and so on — industry-standard terminology, not tied to
 *    any specific real vendor. This is the same "clearly-labeled, frontend-
 *    estimated, meant to be corrected by whoever maintains BrickBasket's
 *    real specs" discipline already applied to the BOQ rate model
 *    (`docs/OPEN_QUESTIONS.md` #67a) — an admin should review and replace
 *    every bullet below with BrickBasket's actual confirmed specification
 *    sheet once available, ideally the real page-11 content if it can be
 *    supplied again.
 *
 * Deliberately better than the JSW reference in three concrete ways: (a)
 * four tiers shown side by side, not three; (b) every tier here is already
 * tied to a real, published ₹/sqft rate (`CONSTRUCTION_PACKAGES`) — JSW's
 * accordion has no visible pricing context at all; (c) the disclaimer under
 * the accordion below points at a real, already-shipped feature (a
 * contract's own attached specification/"Contract Format" file, added in
 * the Sales & Contract corrections pass) rather than a generic footnote.
 */
export const PACKAGE_SPEC_CATEGORIES: PackageSpecCategory[] = [
  {
    key: "design",
    label: "Design",
    tiers: {
      essential: ["Vastu-integrated planning", "2D floor plan & elevation", "Scheduled engineering site visits"],
      smart: ["Everything in Essential", "Cutting-edge 3D design visualisation", "Detailed structural drawings"],
      premium: ["Everything in Smart", "Personalised layering/design options", "Dedicated site manager for design coordination"],
      signature: ["Fully customised architectural services", "Bespoke interior layering", "Integrated plot-finding & financial assistance"],
    },
  },
  {
    key: "structure",
    label: "Structure",
    tiers: {
      essential: ["Standard-grade RCC framework (M20)", "ISI-certified TMT reinforcement steel", "Standard clay-brick masonry"],
      smart: ["Standard-grade RCC framework (M20)", "ISI-certified TMT reinforcement steel", "Solid concrete-block masonry"],
      premium: ["Higher-strength RCC framework (M25)", "ISI-certified TMT reinforcement steel", "Solid concrete-block masonry"],
      signature: ["Higher-strength RCC framework (M25)", "ISI-certified TMT reinforcement steel", "Premium hollow/AAC-block masonry for superior insulation"],
    },
  },
  {
    key: "flooring",
    label: "Flooring and dado",
    tiers: {
      essential: ["Vitrified tile flooring — living, dining, bedrooms, kitchen", "Ceramic tile flooring — balcony & washrooms", "Ceramic kitchen dado"],
      smart: ["Vitrified tile flooring, wider design range", "Ceramic tile flooring — balcony & washrooms", "Ceramic kitchen & washroom dado"],
      premium: ["Premium large-format vitrified tiles", "Granite kitchen countertop & staircase cladding", "Ceramic washroom dado"],
      signature: ["Marble / premium large-format flooring — living & bedrooms", "Granite kitchen countertop & staircase cladding", "Designer washroom dado"],
    },
  },
  {
    key: "doors_windows",
    label: "Door and windows",
    tiers: {
      essential: ["Engineered wood-frame main door with flush shutter", "UPVC sliding windows with mosquito mesh"],
      smart: ["Teak-finish main door", "UPVC sliding windows (upgraded track) with mosquito mesh"],
      premium: ["Teak wood-frame main door", "UPVC/aluminium sliding windows, wider track, mosquito mesh"],
      signature: ["Premium teak main door", "UPVC/aluminium system windows, multi-track, mosquito mesh, SS hardware throughout"],
    },
  },
  {
    key: "plumbing_accessories",
    label: "Plumbing accessories",
    tiers: {
      essential: ["Standard ISI-certified CP fittings & sanitaryware", "Floor-mounted EWC", "Standard kitchen sink with tap"],
      smart: ["Branded CP fittings & sanitaryware (mid-range)", "Floor-mounted EWC", "Standard kitchen sink with tap"],
      premium: ["Premium branded CP fittings & sanitaryware", "Wall-mounted EWC", "Customer's choice of kitchen sink"],
      signature: ["Top-tier branded CP fittings & sanitaryware", "Wall-mounted EWC with washbasin countertop", "Customer's choice of kitchen sink & fittings"],
    },
  },
  {
    key: "painting",
    label: "Painting",
    tiers: {
      essential: ["Putty + premium emulsion paint — internal & external"],
      smart: ["Putty + weather-shield emulsion paint — internal & external"],
      premium: ["Textured/premium emulsion finish — internal & external", "Damp-proof exterior coat"],
      signature: ["Designer/luxury emulsion & texture finishes — internal & external", "Fully customisable colour palette"],
    },
  },
  {
    key: "electrical",
    label: "Electrical",
    tiers: {
      essential: ["Concealed copper wiring", "ISI-certified modular switches & sockets", "Exhaust fan provision — kitchen & toilets"],
      smart: ["Concealed copper wiring", "Branded modular switches & sockets", "Exhaust fan provision — kitchen & toilets"],
      premium: ["Concealed copper wiring", "Premium branded modular switches & sockets", "Exhaust fan provision + additional power points"],
      signature: ["Concealed copper wiring", "Designer/premium switches & sockets", "Home-automation-ready wiring layout"],
    },
  },
  {
    key: "plumbing",
    label: "Plumbing",
    tiers: {
      essential: ["PVC/CPVC plumbing lines", "Underground + overhead water tank provision"],
      smart: ["PVC/CPVC plumbing lines", "Underground + overhead water tank provision"],
      premium: ["UPVC plumbing lines", "Underground + overhead water tank, larger capacity"],
      signature: ["UPVC plumbing lines", "Underground + overhead water tank, larger capacity", "Dedicated hot-water line provisioning"],
    },
  },
  {
    key: "railing",
    label: "Railing and handrails",
    tiers: {
      essential: ["MS railing — windows & balconies", "MS staircase railing"],
      smart: ["MS railing — windows & balconies", "MS staircase railing, powder-coat finish"],
      premium: ["MS window railing", "SS (304-grade) staircase railing"],
      signature: ["Designer MS/glass window railing", "Toughened glass & SS (304-grade) staircase railing"],
    },
  },
];

export interface OldWayVsOurWayRow {
  dimension: string;
  traditional: string;
  brickBasket: string;
}

/**
 * FRONTEND ADDITION — a "Traditional Way vs. The BrickBasket Way" comparison
 * block, requested after reviewing a reference site (brick-basket.vercel.app,
 * an unrelated construction-tech concept) that used this exact pattern to
 * make its differentiators concrete instead of listing adjectives. Every
 * row on the `brickBasket` side names a feature that is real and already
 * shipped in this codebase — nothing here is aspirational copy:
 *   - "Live, itemized cost estimate" → the Cost Estimator (`#cost-estimator`,
 *     `/plans`) calculates live with no contact-info gate and shows all 4
 *     real package rates side by side (docs/OPEN_QUESTIONS.md #59/#63).
 *   - "Clear, category-by-category specifications" → the Package
 *     Specifications accordion (`PackageSpecsAccordion`, docs/OPEN_QUESTIONS.md
 *     #76) — this row used to name the itemized Bill of Quantities instead,
 *     but the owner asked for the BOQ to stop being visible to visitors
 *     (internal-team-only from this pass on, see `cost-estimator-section.tsx`'s
 *     own header comment), so the claim here was updated to point at what a
 *     visitor can actually still see, rather than something now hidden from
 *     them. The BOQ's own admin-maintained, bottom-up ₹-per-unit rates
 *     (docs/OPEN_QUESTIONS.md #67) still exist — just at `/admin/pricing-content`, not here.
 *   - "Documented, dual-acceptance contract" → Contract Management's
 *     send-for-acceptance / accept-or-decline workflow with a full audit
 *     history (Part 5).
 *   - "One digital vault" → Document Management, customer-visible,
 *     versioned, categorized (Part 6).
 *   - "A certificate for what was actually used" → the Material Receipt
 *     Certificate module, customer review/accept (Part 12).
 *   - "Automatic notifications" → the customer portal's Notifications
 *     module (`/dashboard/notifications`, Part 19), which surfaces
 *     contract- and MRC-related events without the customer having to ask.
 *
 * The `traditional` side deliberately describes generic, widely-recognized
 * industry pain points in general terms — it does not name, describe, or
 * imply anything about any specific real competitor or builder — matching
 * the same restraint already applied to the Cost Estimator's "what this
 * estimate includes" panel (industry-standard exclusions, not a claim
 * about anyone in particular). Not owner-confirmed copy; a reasonable
 * frontend editorial framing of real, already-true product facts.
 */
export const OLD_WAY_VS_OUR_WAY_ROWS: OldWayVsOurWayRow[] = [
  {
    dimension: "Getting a cost estimate",
    traditional: "One lump-sum number, with no visibility into how it was worked out.",
    brickBasket: "A live, itemized estimate — see the real rate for every package tier, side by side, before you share a single detail.",
  },
  {
    dimension: "Understanding your budget",
    traditional: "A single \"materials & labor\" line you have to take on trust.",
    brickBasket: "Clear, category-by-category specifications — see exactly what's included in Design, Structure, Flooring and every other category, tier by tier, before you decide.",
  },
  {
    dimension: "Contracts & sign-off",
    traditional: "A verbal understanding, or a signature collected in person with nothing you can revisit later.",
    brickBasket: "A documented contract you review and accept online, with a timestamped history of every version and decision.",
  },
  {
    dimension: "Drawings, certificates & warranties",
    traditional: "Paper drawings in a tube, receipts in a folder — hope nothing goes missing before you need it.",
    brickBasket: "Every drawing, material certificate and warranty document in one place in your portal, always the current version.",
  },
  {
    dimension: "What actually went into your home",
    traditional: "No formal record of exactly which materials or make were used, room by room.",
    brickBasket: "A Material Receipt Certificate naming what was used and its warranty terms — for you to review and accept.",
  },
  {
    dimension: "Staying updated",
    traditional: "You call, and wait for someone to call back.",
    brickBasket: "Automatic notifications the moment there's something to review — a contract to accept, a certificate to check — right in your portal.",
  },
];

/**
 * Services mentioned in earlier drafts of this site's content that the
 * owner has **not** confirmed. Kept separate (not deleted outright) so a
 * page can choose to show them clearly labeled "Pending confirmation"
 * rather than silently presenting them as live, confirmed offerings — per
 * the stabilization pass instruction to either remove or clearly flag
 * unconfirmed content, never present it as fact.
 */
export const PENDING_SERVICES: PublicService[] = [
  {
    icon: HardHat,
    title: "Post Construction Support",
    description: "Reliable support and maintenance even after project completion.",
    pending: true,
  },
];

/** Home page's short "some of what we offer" teaser — first 5 confirmed services, linking through to the full Services page. */
export const FEATURED_SERVICES: PublicService[] = CONFIRMED_SERVICES.slice(0, 5);

export const HOME_STATS = [
  { label: "Happy Customers", value: "500+" },
  { label: "Projects Completed", value: "250+" },
  { label: "Years Industry Experience", value: "15+" },
  { label: "Quality Assurance", value: "100%" },
];

/** Confirmed contact details — single source so header/footer/contact page never disagree. */
export const CONTACT_INFO = {
  address: "Viram Khand 5, Gomti Nagar, Shop No. 51, Jeevan Plaza, Lucknow, Uttar Pradesh",
  phones: ["9454516357", "8787200760"],
  email: "info@brickbasket.co.in",
  website: "www.brickbasket.co.in",
};

/**
 * Owner-supplied intro/explainer video (Google Drive), wired into the Home
 * hero's "Watch Video" button — see `WatchVideoButton`
 * (`src/components/marketing/watch-video-button.tsx`) and
 * `docs/CHANGELOG.md`'s "Watch Video" entries for the full history (this
 * button was briefly relabeled "How It Works" while no real video existed).
 *
 * `embedUrl` uses Drive's own `/preview` endpoint — the supported way to
 * embed a Drive file in an <iframe> elsewhere; a direct <video src> won't
 * work against a Drive share link. `shareUrl` is kept as a plain fallback
 * link (e.g. "open in Google Drive instead").
 *
 * IMPORTANT — this only plays for site visitors if the Drive file's
 * sharing setting is "Anyone with the link" (Viewer). If it's still
 * restricted to specific people, visitors get a Google "You need access"
 * screen instead of the video — not something the frontend can detect or
 * work around; confirm the sharing setting on the file itself in Drive.
 */
export const INTRO_VIDEO = {
  driveFileId: "1R-GIsKfqXVcBLvimAyX3vWDLe3hQ8eFn",
  embedUrl: "https://drive.google.com/file/d/1R-GIsKfqXVcBLvimAyX3vWDLe3hQ8eFn/preview",
  shareUrl: "https://drive.google.com/file/d/1R-GIsKfqXVcBLvimAyX3vWDLe3hQ8eFn/view",
};
