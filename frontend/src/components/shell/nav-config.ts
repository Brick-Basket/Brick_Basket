import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FolderKanban,
  FileSignature,
  FileText,
  Bell,
  UserCircle,
  Users,
  Truck,
  ClipboardList,
  FileSearch,
  ShoppingCart,
  PackageCheck,
  Boxes,
  Trash2,
  BadgeCheck,
  CalendarRange,
  NotebookPen,
  Wallet,
  Landmark,
  Receipt,
  Building2,
  FileBarChart,
  TrendingUp,
  Settings2,
} from "lucide-react";
import { ADMIN_ROUTES, PORTAL_ROUTES } from "@/lib/constants/routes";
import type { PermissionKey } from "@/lib/permissions/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Omit for items every signed-in user of this shell may see (e.g. Home). */
  permission?: PermissionKey;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const PORTAL_NAV: NavGroup[] = [
  {
    items: [
      { label: "Overview", href: PORTAL_ROUTES.home, icon: LayoutDashboard },
      { label: "My Projects", href: PORTAL_ROUTES.projects, icon: FolderKanban },
      { label: "Contracts", href: PORTAL_ROUTES.contracts, icon: FileSignature, permission: "contracts:read" },
      { label: "Documents", href: PORTAL_ROUTES.documents, icon: FileText, permission: "documents:read" },
      { label: "Material Receipts", href: PORTAL_ROUTES.mrc, icon: BadgeCheck, permission: "mrc:read" },
      { label: "Payments", href: PORTAL_ROUTES.payments, icon: Wallet, permission: "finance:read" },
      { label: "Notifications", href: PORTAL_ROUTES.notifications, icon: Bell },
      { label: "Profile", href: PORTAL_ROUTES.profile, icon: UserCircle },
    ],
  },
];

export const ADMIN_NAV: NavGroup[] = [
  { items: [{ label: "Dashboard", href: ADMIN_ROUTES.home, icon: LayoutDashboard }] },
  {
    label: "Sales & Contracts",
    items: [
      { label: "Leads", href: ADMIN_ROUTES.leads, icon: Users, permission: "leads:read" },
      { label: "Contracts", href: ADMIN_ROUTES.contracts, icon: FileSignature, permission: "contracts:read" },
      { label: "Documents", href: ADMIN_ROUTES.documents, icon: FileText, permission: "documents:read" },
    ],
  },
  {
    label: "Vendors & Supply Chain",
    items: [
      { label: "Vendors", href: ADMIN_ROUTES.vendors, icon: Truck, permission: "vendors:read" },
      { label: "Accepted Cost Estimate", href: ADMIN_ROUTES.ace, icon: ClipboardList, permission: "ace:read" },
      { label: "Requisitions", href: ADMIN_ROUTES.requisitions, icon: FileSearch, permission: "requisitions:read" },
      { label: "RFQs", href: ADMIN_ROUTES.rfqs, icon: FileSearch, permission: "rfq:read" },
      { label: "Purchase Orders", href: ADMIN_ROUTES.purchaseOrders, icon: ShoppingCart, permission: "po:read" },
    ],
  },
  {
    label: "Stores",
    items: [
      { label: "GRN", href: ADMIN_ROUTES.grn, icon: PackageCheck, permission: "grn:read" },
      { label: "Stock Statement", href: ADMIN_ROUTES.stock, icon: Boxes, permission: "stock:read" },
      { label: "Wastage", href: ADMIN_ROUTES.wastage, icon: Trash2, permission: "wastage:read" },
      { label: "Material Receipts", href: ADMIN_ROUTES.mrc, icon: BadgeCheck, permission: "mrc:read" },
      {
        label: "Material Requisitions (MR)",
        href: ADMIN_ROUTES.storeRequisitions,
        icon: ClipboardList,
        permission: "store_requisitions:read",
      },
    ],
  },
  {
    label: "Project Management",
    items: [
      { label: "Schedule", href: ADMIN_ROUTES.schedule, icon: CalendarRange, permission: "schedule:read" },
      { label: "Daily Progress (DPR)", href: ADMIN_ROUTES.dpr, icon: NotebookPen, permission: "dpr:read" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Project Cost", href: ADMIN_ROUTES.projectCost, icon: Wallet, permission: "finance:read" },
      { label: "Payments & Receipts", href: ADMIN_ROUTES.payments, icon: Receipt, permission: "finance:read" },
      { label: "Bank & Cash", href: ADMIN_ROUTES.bankCash, icon: Landmark, permission: "finance:read" },
      { label: "Taxes & Statutory", href: ADMIN_ROUTES.taxes, icon: FileBarChart, permission: "finance:read" },
      { label: "Fixed Assets", href: ADMIN_ROUTES.fixedAssets, icon: Building2, permission: "finance:read" },
      { label: "GSTR Reporting", href: ADMIN_ROUTES.gstr, icon: FileBarChart, permission: "finance:read" },
      { label: "Cost to Complete", href: ADMIN_ROUTES.costToComplete, icon: TrendingUp, permission: "finance:read" },
    ],
  },
  {
    label: "Other",
    items: [
      { label: "Cost Management", href: ADMIN_ROUTES.costManagement, icon: Settings2, permission: "cost_management:view" },
    ],
  },
];
