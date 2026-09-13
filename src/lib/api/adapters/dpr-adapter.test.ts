import { describe, expect, it } from "vitest";
import { dprAdapter } from "./dpr-adapter";
import { scheduleAdapter } from "./schedule-adapter";

const ACTOR = { id: "u_test_site_engineer", name: "Test Site Engineer" };

/** A fresh Schedule activity to link DPR work-item lines against, isolated from any mock-data activity. */
async function createTestActivity(projectId = "proj_luxury_villa") {
  return scheduleAdapter.create(
    {
      projectId,
      activity: "Test Activity (DPR reconciliation suite)",
      uom: "Cum",
      quantity: 1000,
      plannedStart: "2026-08-01",
      plannedEnd: "2026-12-31",
    },
    ACTOR,
  );
}

describe("dprAdapter — create → Schedule contribution", () => {
  it("pushes a new cumulative progress entry, tagged with a stable dpr source, when a work-item line links to a Schedule activity", async () => {
    const activity = await createTestActivity();
    const dpr = await dprAdapter.create(
      {
        projectId: activity.projectId,
        reportDate: "2026-09-01",
        manpower: [],
        workItems: [{ workItemMasterId: "civil_2", location: "Block A", plannedQty: 500, todayQty: 40, scheduleActivityId: activity.id }],
      },
      ACTOR,
    );

    const progress = await scheduleAdapter.listProgress(activity.id);
    const dprEntry = progress.find((p) => p.source?.type === "dpr");
    expect(dprEntry).toBeDefined();
    expect(dprEntry?.executedQuantity).toBe(40);
    expect(dprEntry?.recordedAt).toBe(dpr.reportDate);
  });

  it("adds on top of an activity's pre-existing progress rather than starting from zero", async () => {
    const activity = await createTestActivity();
    await scheduleAdapter.addProgress(activity.id, { recordedAt: "2026-08-15", executedQuantity: 200 }, ACTOR);

    await dprAdapter.create(
      {
        projectId: activity.projectId,
        reportDate: "2026-09-01",
        manpower: [],
        workItems: [{ workItemMasterId: "civil_2", location: "Block B", plannedQty: 500, todayQty: 30, scheduleActivityId: activity.id }],
      },
      ACTOR,
    );

    const progress = await scheduleAdapter.listProgress(activity.id);
    const dprEntry = progress.find((p) => p.source?.type === "dpr");
    expect(dprEntry?.executedQuantity).toBe(230); // 200 pre-existing + 30 today
  });
});

describe("dprAdapter — edit → Schedule contribution corrected", () => {
  it("corrects the same pushed entry in place on a re-edit, rather than appending a duplicate", async () => {
    const activity = await createTestActivity();
    const dpr = await dprAdapter.create(
      {
        projectId: activity.projectId,
        reportDate: "2026-09-01",
        manpower: [],
        workItems: [{ workItemMasterId: "civil_3", location: "Block C", plannedQty: 300, todayQty: 25, scheduleActivityId: activity.id }],
      },
      ACTOR,
    );

    await dprAdapter.update(
      dpr.id,
      { workItems: [{ workItemMasterId: "civil_3", location: "Block C", plannedQty: 300, todayQty: 60, scheduleActivityId: activity.id }] },
      ACTOR,
    );

    const progress = await scheduleAdapter.listProgress(activity.id);
    const dprEntries = progress.filter((p) => p.source?.type === "dpr");
    expect(dprEntries).toHaveLength(1); // corrected in place, not duplicated
    expect(dprEntries[0]!.executedQuantity).toBe(60);
  });
});

describe("dprAdapter — remove/relink Schedule line → old contribution reconciled", () => {
  it("removes the previously-pushed entry when a linked work-item line is deleted from the DPR on a later edit", async () => {
    const activity = await createTestActivity();
    const dpr = await dprAdapter.create(
      {
        projectId: activity.projectId,
        reportDate: "2026-09-01",
        manpower: [],
        workItems: [{ workItemMasterId: "civil_4", location: "Block D", plannedQty: 10, todayQty: 2, scheduleActivityId: activity.id }],
      },
      ACTOR,
    );
    expect((await scheduleAdapter.listProgress(activity.id)).some((p) => p.source?.type === "dpr")).toBe(true);

    // Line removed entirely — replaced with an unlinked work item.
    await dprAdapter.update(
      dpr.id,
      { workItems: [{ workItemMasterId: "civil_5", plannedQty: 5, todayQty: 1 }] },
      ACTOR,
    );

    const progress = await scheduleAdapter.listProgress(activity.id);
    expect(progress.some((p) => p.source?.type === "dpr")).toBe(false);
  });

  it("removes the old activity's entry and pushes to the new activity when a line is re-pointed at a different Schedule activity", async () => {
    const activityA = await createTestActivity();
    const activityB = await createTestActivity();
    const dpr = await dprAdapter.create(
      {
        projectId: activityA.projectId,
        reportDate: "2026-09-01",
        manpower: [],
        workItems: [{ workItemMasterId: "civil_6", location: "Block E", plannedQty: 40, todayQty: 8, scheduleActivityId: activityA.id }],
      },
      ACTOR,
    );
    expect((await scheduleAdapter.listProgress(activityA.id)).some((p) => p.source?.type === "dpr")).toBe(true);

    await dprAdapter.update(
      dpr.id,
      { workItems: [{ workItemMasterId: "civil_6", location: "Block E", plannedQty: 40, todayQty: 8, scheduleActivityId: activityB.id }] },
      ACTOR,
    );

    expect((await scheduleAdapter.listProgress(activityA.id)).some((p) => p.source?.type === "dpr")).toBe(false);
    expect((await scheduleAdapter.listProgress(activityB.id)).some((p) => p.source?.type === "dpr")).toBe(true);
  });

  it("treats a changed location as a different source key, reconciling the old entry away", async () => {
    const activity = await createTestActivity();
    const dpr = await dprAdapter.create(
      {
        projectId: activity.projectId,
        reportDate: "2026-09-01",
        manpower: [],
        workItems: [{ workItemMasterId: "civil_7", location: "Block F", plannedQty: 20, todayQty: 5, scheduleActivityId: activity.id }],
      },
      ACTOR,
    );

    await dprAdapter.update(
      dpr.id,
      { workItems: [{ workItemMasterId: "civil_7", location: "Block G", plannedQty: 20, todayQty: 5, scheduleActivityId: activity.id }] },
      ACTOR,
    );

    const progress = await scheduleAdapter.listProgress(activity.id);
    const dprEntries = progress.filter((p) => p.source?.type === "dpr");
    // Exactly one surviving dpr-sourced entry (the new location's), the old one reconciled away.
    expect(dprEntries).toHaveLength(1);
    expect(dprEntries[0]!.executedQuantity).toBe(5);
  });
});
