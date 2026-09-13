import { z } from "zod";
import { getDPRWorkItem } from "@/lib/constants/dpr-work-items";

/**
 * Shared zod schema for `DPRForm` + its manpower/work-item editors — kept
 * in one file so the three components agree on field paths without
 * importing each other, mirroring `contract-form-schema.ts` (Part 5) /
 * `mrc-form-schema.ts` (Part 12).
 */
export const dprManpowerRowSchema = z.object({
  category: z.enum(["civil_mason", "carpenter", "bar_bender", "plumber", "electrician", "painter", "tile_masonry_finishing", "other"]),
  skilled: z.coerce.number().min(0, "Can't be negative"),
  unskilled: z.coerce.number().min(0, "Can't be negative"),
  agency: z.string().optional(),
});

export const dprWorkItemRowSchema = z
  .object({
    workItemMasterId: z.string().min(1, "Select a work item"),
    otherDescription: z.string().optional(),
    otherUom: z.string().optional(),
    location: z.string().optional(),
    plannedQty: z.coerce.number().min(0, "Can't be negative"),
    todayQty: z.coerce.number().min(0, "Can't be negative"),
    remarks: z.string().optional(),
    /** Empty string means "not linked to a Schedule activity". */
    scheduleActivityId: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    const master = getDPRWorkItem(val.workItemMasterId);
    if (master?.isOtherCatchAll) {
      if (!val.otherDescription || val.otherDescription.trim().length < 2) {
        ctx.addIssue({ code: "custom", path: ["otherDescription"], message: "Describe the other work done" });
      }
      if (!val.otherUom || val.otherUom.trim().length < 1) {
        ctx.addIssue({ code: "custom", path: ["otherUom"], message: "Add a unit" });
      }
    }
  });

export const dprFormSchema = z.object({
  projectId: z.string().min(1, "Select a project"),
  reportDate: z.string().min(1, "Select a date"),
  notes: z.string().optional(),
  manpower: z.array(dprManpowerRowSchema).length(8, "Every manpower category must be present"),
  workItems: z.array(dprWorkItemRowSchema),
});

export type DPRFormValues = z.infer<typeof dprFormSchema>;
