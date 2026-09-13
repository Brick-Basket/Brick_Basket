import { z } from "zod";

/**
 * Shared zod schema for `ContractForm` + `ContractLineItemsEditor` — kept in
 * one file so the two components agree on field paths without importing
 * each other.
 */
export const contractLineItemSchema = z.object({
  category: z.enum(["civil", "electrical", "plumbing_sanitary", "mechanical", "finishing", "labour", "design_consultancy", "other"]),
  description: z.string().min(2, "Add a description"),
  uom: z.string().min(1, "Add a unit"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  rate: z.coerce.number().nonnegative("Rate can't be negative"),
});

export const contractFormSchema = z.object({
  title: z.string().min(3, "Add a contract title"),
  customerId: z.string().min(1, "Select a customer"),
  projectId: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(contractLineItemSchema).min(1, "Add at least one line item"),
});

export type ContractFormValues = z.infer<typeof contractFormSchema>;
