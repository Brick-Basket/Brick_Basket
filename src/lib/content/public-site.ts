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
