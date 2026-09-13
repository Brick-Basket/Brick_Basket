import { FileCheck2, FileText, Layers, Layers3, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DocumentCategory } from "@/types/domain/document";

/** Confirmed set from the owner requirements — not configurable, see document.ts's header comment. */
export const DOCUMENT_CATEGORY_CONFIG: Record<DocumentCategory, { label: string; icon: LucideIcon; isWarranty: boolean }> = {
  finalized_drawing: { label: "Finalized Drawing", icon: FileText, isWarranty: false },
  layout_2d: { label: "2D Layout", icon: Layers, isWarranty: false },
  layout_3d: { label: "3D Layout", icon: Layers3, isWarranty: false },
  material_test_certificate: { label: "Material / Test Certificate", icon: FileCheck2, isWarranty: false },
  warranty_tax_invoice: { label: "Tax Invoice (Warranty, Price-Free)", icon: ShieldCheck, isWarranty: true },
  warranted_goods_certificate: { label: "Warranted Goods — Invoice & Certificate", icon: ShieldCheck, isWarranty: true },
};

export const DOCUMENT_CATEGORY_ORDER: DocumentCategory[] = [
  "finalized_drawing",
  "layout_2d",
  "layout_3d",
  "material_test_certificate",
  "warranty_tax_invoice",
  "warranted_goods_certificate",
];

export const WARRANTY_CATEGORIES: DocumentCategory[] = DOCUMENT_CATEGORY_ORDER.filter(
  (c) => DOCUMENT_CATEGORY_CONFIG[c].isWarranty,
);
