import { z } from "zod";

/**
 * Shared zod schema for `MRCForm` + `MRCLineItemsEditor` — kept in one file
 * so the two components agree on field paths without importing each
 * other, mirroring `contract-form-schema.ts` (Part 5).
 *
 * Every row carries every field so `useFieldArray` has a single stable
 * shape to work with; `superRefine` enforces which fields are actually
 * required for each `source`, since a discriminated-union array doesn't
 * play well with react-hook-form's field paths.
 */
export const mrcLineItemSchema = z
  .object({
    source: z.enum(["grn", "manual"]),
    grnLineItemId: z.string().optional(),
    description: z.string().optional(),
    uom: z.string().optional(),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    make: z.string().optional(),
    warrantyTerms: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.source === "grn" && !val.grnLineItemId) {
      ctx.addIssue({ code: "custom", path: ["grnLineItemId"], message: "Select a received line to certify" });
    }
    if (val.source === "manual") {
      if (!val.description || val.description.trim().length < 2) {
        ctx.addIssue({ code: "custom", path: ["description"], message: "Add a description" });
      }
      if (!val.uom || val.uom.trim().length < 1) {
        ctx.addIssue({ code: "custom", path: ["uom"], message: "Add a unit" });
      }
      if (!val.make || val.make.trim().length < 1) {
        ctx.addIssue({ code: "custom", path: ["make"], message: "Add a make/brand" });
      }
    }
  });

export const mrcFormSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  projectId: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(mrcLineItemSchema).min(1, "Add at least one material line"),
});

export type MRCFormValues = z.infer<typeof mrcFormSchema>;
