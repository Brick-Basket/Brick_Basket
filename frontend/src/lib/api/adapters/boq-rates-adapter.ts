import type { BoqRateItem, UpdateBoqRateItemInput } from "@/types/domain/boq-rate-item";
import { mockBoqRateItems } from "@/data/mock/boq-rate-items";

/**
 * Adapter boundary for the BOQ Rate Item module (see docs/OPEN_QUESTIONS.md
 * #67, `src/types/domain/boq-rate-item.ts`). Components/hooks depend on this
 * interface, never on the concrete implementation below.
 *
 * Backend contract — proposed, not yet implemented anywhere real (see
 * docs/API_CONTRACTS.md's "Pricing & Packages Content" section):
 *   GET   /api/boq-rate-items        — list all 11 (public read — the Cost
 *                                       Estimator needs this unauthenticated,
 *                                       same reasoning as package pricing)
 *   PATCH /api/boq-rate-items/:id    — update qtyPerSqft/ratePerUnit/rationale,
 *                                       permission: pricing_content:manage
 *
 * Only `update` exists (no create/delete) — this is a fixed catalog of 11
 * known materials/labor items tied 1:1 to the Cost Estimator's calculation
 * code (`cost-estimator-math.ts`'s per-item logic references each `key`
 * directly), not an open-ended list an admin can add arbitrary rows to.
 * Adding an item would be a calculation-code change, not a content edit.
 */
export interface BoqRatesAdapter {
  list(): Promise<BoqRateItem[]>;
  update(id: string, patch: UpdateBoqRateItemInput, actor?: { name: string }): Promise<BoqRateItem>;
}

/**
 * In-memory mock implementation. Simulates network latency so loading
 * states are exercised in the UI even before a real API exists. Data does
 * not persist across a full page reload — this is demo behavior, not
 * backend persistence, and must never be presented to the user as saved.
 */
class MockBoqRatesAdapter implements BoqRatesAdapter {
  private items: BoqRateItem[] = [...mockBoqRateItems];

  async list(): Promise<BoqRateItem[]> {
    await delay(250);
    return [...this.items];
  }

  async update(id: string, patch: UpdateBoqRateItemInput, actor?: { name: string }): Promise<BoqRateItem> {
    await delay(400);
    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("BOQ rate item not found.");
    const current = this.items[index];
    if (!current) throw new Error("BOQ rate item not found.");

    const updated: BoqRateItem = {
      ...current,
      qtyPerSqft: patch.qtyPerSqft ?? current.qtyPerSqft,
      rationale: patch.rationale ?? current.rationale,
      ratePerUnit: patch.ratePerUnit ? { ...current.ratePerUnit, ...patch.ratePerUnit } : current.ratePerUnit,
      updatedAt: new Date().toISOString(),
      // Mock-only convenience — a real backend derives this from the
      // authenticated session, never trusts a client-supplied actor
      // (see docs/BACKEND_CLAUDE_HANDOFF.md §5).
      updatedBy: actor?.name ?? current.updatedBy,
    };
    this.items = [...this.items.slice(0, index), updated, ...this.items.slice(index + 1)];
    return updated;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const boqRatesAdapter: BoqRatesAdapter = new MockBoqRatesAdapter();
