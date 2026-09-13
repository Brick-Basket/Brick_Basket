import { z } from "zod";

/**
 * Shared zod schema for `RequisitionForm` + `MaterialRequirementEditor` —
 * kept in one file so the two components agree on field paths without
 * importing each other (same pattern as `contract-form-schema.ts`).
 */
// FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase 12):
// `aceItemId` used to be unconditionally optional, even when
// `source === "predefined"` — a real gap flagged in
// docs/OPEN_QUESTIONS.md #41(c), inconsistent with MRC's equivalent
// `grnLineItemId`-required-when-`source === "grn"` branch. Fixed the same
// way, via `.superRefine()` on the line schema.
export const materialRequirementSchema = z
  .object({
    source: z.enum(["predefined", "additional"]),
    aceItemId: z.string().optional(),
    description: z.string().min(2, "Add a description"),
    uom: z.string().min(1, "Add a unit"),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    brand: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.source === "predefined" && !val.aceItemId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select the ACE item this line comes from",
        path: ["aceItemId"],
      });
    }
  });

export const requisitionFormSchema = z.object({
  projectId: z.string().min(1, "Select a project"),
  notes: z.string().optional(),
  lines: z.array(materialRequirementSchema).min(1, "Add at least one item"),
});

export type RequisitionFormValues = z.infer<typeof requisitionFormSchema>;
