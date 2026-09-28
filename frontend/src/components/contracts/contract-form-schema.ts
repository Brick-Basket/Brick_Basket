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

export const contractFormSchema = z
  .object({
    title: z.string().min(3, "Add a contract title"),
    customerId: z.string().min(1, "Select a customer"),
    projectId: z.string().optional(),
    city: z.string().min(2, "Add a city"),
    state: z.string().min(2, "Add a state"),
    contractCategory: z.enum(["ihb", "large_construction", "special_services"]),
    servicesDescription: z.string().optional(),
    packageCriteria: z.string().optional(),
    contractDate: z.string().min(1, "Add the contract date"),
    notes: z.string().optional(),
    lineItems: z.array(contractLineItemSchema).min(1, "Add at least one line item"),
  })
  .superRefine((values, ctx) => {
    if (values.contractCategory === "large_construction" && !values.servicesDescription?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Describe the services included for a Large Construction contract",
        path: ["servicesDescription"],
      });
    }
    if (values.contractCategory === "ihb" && !values.packageCriteria) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select the package criteria for an IHB contract",
        path: ["packageCriteria"],
      });
    }
  });

export type ContractFormValues = z.infer<typeof contractFormSchema>;
