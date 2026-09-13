"use client";

import { ModulePlaceholder } from "@/components/domain/module-placeholder";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";

/**
 * §8H COST MANAGEMENT — the owner's explicit instruction: "detailed Cost
 * Management requirements will come in a separate Excel sheet from
 * Pushkar Tiwari. DO NOT invent this module's detailed business rules.
 * Create a scalable placeholder module shell with 'Detailed specification
 * pending' and an integration-ready route, not fake functionality."
 *
 * Unlike Part 18's other route (`/admin/finance/cost-to-complete`), there
 * is no `CostManagement` type, no adapter, and no business logic at all
 * here — deliberately. The one change from the Part 1–17 scaffold this
 * route already had is gating it behind `cost_management:view`, the same
 * permission `nav-config.ts` already used to hide/show its nav entry
 * (Part 3) — every other implemented route in this app is wrapped in a
 * `PermissionGuard`, and a placeholder shouldn't be the one exception,
 * even though it exposes no real data. No permission changes needed:
 * `cost_management:view` already existed and is already held only by
 * `admin` — see `docs/OPEN_QUESTIONS.md` #4 and #39.
 */
export default function CostManagementPage() {
  return (
    <PermissionGuard
      permission="cost_management:view"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Cost Management" description="Ask an administrator for the cost_management:view permission." />
        </div>
      }
    >
      <ModulePlaceholder
        title="Cost Management — Detailed specification pending"
        part={18}
        description="Business rules for this module are pending a separate Excel specification from Pushkar Tiwari (see docs/OPEN_QUESTIONS.md #4) — this route, its layout and its permission boundary are scaffolded ahead of that spec, with no invented functionality."
      />
    </PermissionGuard>
  );
}
