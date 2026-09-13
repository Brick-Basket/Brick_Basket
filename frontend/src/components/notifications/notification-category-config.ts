import {
  BellRing,
  ClipboardCheck,
  FileCheck2,
  FileWarning,
  PackageSearch,
  ReceiptText,
  UserPlus,
  CalendarClock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NotificationCategory, NotificationSeverity } from "@/types/domain/notification";
import type { BadgeProps } from "@/components/ui/badge";

/** Icon + label per `NotificationCategory` — same business-vocabulary-container pattern `LEAD_SOURCE_CONFIG`/`SCHEDULE_PROGRESS_STATE_CONFIG` already use, so `NotificationList`/`NotificationsMenu` stay category-agnostic. */
export const NOTIFICATION_CATEGORY_CONFIG: Record<NotificationCategory, { label: string; icon: LucideIcon }> = {
  lead: { label: "Lead", icon: UserPlus },
  requisition: { label: "Requisition", icon: ClipboardCheck },
  purchase_order: { label: "Purchase Order", icon: FileCheck2 },
  grn: { label: "Goods Receipt", icon: PackageSearch },
  tax: { label: "Taxes & Statutory", icon: ReceiptText },
  schedule: { label: "Schedule", icon: CalendarClock },
  contract: { label: "Contract", icon: FileWarning },
  mrc: { label: "Material Receipt Certificate", icon: BellRing },
};

/** `StatusBadge`-style tone per `NotificationSeverity`. */
export const NOTIFICATION_SEVERITY_TONE: Record<NotificationSeverity, BadgeProps["variant"]> = {
  info: "neutral",
  warning: "warning",
  urgent: "error",
};
