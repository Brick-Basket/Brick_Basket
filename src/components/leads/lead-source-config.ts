import { Globe, MessageCircle, Phone, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { LeadSource } from "@/types/domain/lead";

/** Confirmed lead sources from the owner requirements — not configurable. */
export const LEAD_SOURCE_CONFIG: Record<LeadSource, { label: string; icon: LucideIcon }> = {
  website: { label: "App / Website", icon: Globe },
  social_media: { label: "Social Media", icon: MessageCircle },
  call_whatsapp: { label: "Calls / WhatsApp", icon: Phone },
  personal_reference: { label: "Personal Reference", icon: Users },
};
