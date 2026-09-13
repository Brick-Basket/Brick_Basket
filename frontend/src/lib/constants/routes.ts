/**
 * Centralized route table (mirrors docs/ROUTES.md). No component should
 * hardcode a path string — import from here instead, so a route rename is a
 * one-file change.
 */
export const PUBLIC_ROUTES = {
  home: "/",
  about: "/about",
  services: "/services",
  plans: "/plans",
  portfolio: "/portfolio",
  howItWorks: "/how-it-works",
  whyUs: "/why-us",
  faq: "/faq",
  contact: "/contact",
  login: "/login",
  register: "/register",
} as const;

export const PORTAL_ROUTES = {
  home: "/dashboard",
  projects: "/dashboard/projects",
  contracts: "/dashboard/contracts",
  documents: "/dashboard/documents",
  mrc: "/dashboard/mrc",
  payments: "/dashboard/payments",
  notifications: "/dashboard/notifications",
  profile: "/dashboard/profile",
} as const;

export const ADMIN_ROUTES = {
  home: "/admin",
  leads: "/admin/leads",
  contracts: "/admin/contracts",
  documents: "/admin/documents",
  vendors: "/admin/vendors",
  ace: "/admin/supply-chain/ace",
  requisitions: "/admin/supply-chain/requisitions",
  rfqs: "/admin/supply-chain/rfqs",
  purchaseOrders: "/admin/purchase-orders",
  grn: "/admin/stores/grn",
  stock: "/admin/stores/stock",
  wastage: "/admin/stores/wastage",
  mrc: "/admin/stores/mrc",
  storeRequisitions: "/admin/stores/requisitions",
  schedule: "/admin/project-management/schedule",
  dpr: "/admin/project-management/dpr",
  projectCost: "/admin/finance/project-cost",
  payments: "/admin/finance/payments",
  bankCash: "/admin/finance/bank-cash",
  taxes: "/admin/finance/taxes",
  fixedAssets: "/admin/finance/fixed-assets",
  gstr: "/admin/finance/gstr",
  costToComplete: "/admin/finance/cost-to-complete",
  costManagement: "/admin/cost-management",
} as const;

// FRONTEND IMPLEMENTATION DECISION (one-page site pass): the Home page is
// now a one-pager with every section stacked behind an anchor `id` (see
// src/app/(public)/page.tsx), so the main nav links scroll to those
// sections instead of navigating to the standalone routes. Each href is
// `/#<section-id>` — Next's `<Link>` resolves that to the Home page and
// scrolls to the matching id, whether you're already on `/` or navigating
// there from another page. The standalone routes (PUBLIC_ROUTES.about,
// .services, etc.) still exist and are used by the footer and for direct
// links/SEO — see docs/OPEN_QUESTIONS.md #46.
export const MAIN_NAV: { label: string; href: string }[] = [
  { label: "Home", href: "/#home" },
  { label: "About Us", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Projects", href: "/#projects" },
  { label: "Why Us", href: "/#why-us" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/#contact" },
];
