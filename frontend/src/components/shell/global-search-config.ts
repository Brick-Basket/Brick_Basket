import type { CurrentUser } from "@/lib/auth/types";
import type { PermissionKey } from "@/lib/permissions/permissions";
import { contractsAdapter } from "@/lib/api/adapters/contracts-adapter";
import { vendorsAdapter } from "@/lib/api/adapters/vendors-adapter";
import { requisitionsAdapter } from "@/lib/api/adapters/requisitions-adapter";
import { rfqAdapter } from "@/lib/api/adapters/rfq-adapter";
import { purchaseOrdersAdapter } from "@/lib/api/adapters/purchase-orders-adapter";
import { grnAdapter } from "@/lib/api/adapters/grn-adapter";
import { mrcAdapter } from "@/lib/api/adapters/mrc-adapter";
import { ADMIN_ROUTES, PORTAL_ROUTES } from "@/lib/constants/routes";

/**
 * Global Search (Part 19) — a `Cmd/Ctrl+K` command palette searching
 * across modules, wired into the shared `Topbar`. Deliberately scoped to
 * exactly the entities with a real `[id]` detail route to land on:
 * Contract, Vendor, Requisition, RFQ, PurchaseOrder, GRN, MRC for staff
 * (7 types); Contract and MRC for the customer persona (2 types, each
 * already scoped to that customer's own records — same
 * `customerId === session.user.id` convention `/dashboard/contracts` uses).
 *
 * **Lead and Project are deliberately excluded** — neither has a
 * dedicated single-record detail route (Lead Management works entirely
 * through a detail *drawer* on the list page, Project has no detail
 * route at all yet), so a search result for either would link to a list,
 * not the record — a weaker result than every other entity here. See
 * `docs/OPEN_QUESTIONS.md` #40.
 *
 * Each entity reuses its own adapter's existing `search` param — no new
 * search index or backend endpoint, same cross-adapter composition
 * discipline used everywhere else in Part 18/19 (the palette just calls
 * seven already-existing `list({ search })` methods and renders their
 * top 5 matches each).
 */
export interface GlobalSearchResult {
  id: string;
  entityLabel: string;
  title: string;
  subtitle?: string;
  href: string;
}

interface GlobalSearchEntityConfig {
  key: string;
  permission: PermissionKey;
  search(query: string, user: CurrentUser): Promise<GlobalSearchResult[]>;
}

const RESULT_LIMIT = 5;

const STAFF_ENTITIES: GlobalSearchEntityConfig[] = [
  {
    key: "contract",
    permission: "contracts:read",
    async search(query) {
      const { items } = await contractsAdapter.list({ search: query, pageSize: RESULT_LIMIT });
      return items.map((c) => ({ id: c.id, entityLabel: "Contract", title: c.contractNumber, subtitle: c.title, href: `${ADMIN_ROUTES.contracts}/${c.id}` }));
    },
  },
  {
    key: "vendor",
    permission: "vendors:read",
    async search(query) {
      const { items } = await vendorsAdapter.list({ search: query, pageSize: RESULT_LIMIT });
      return items.map((v) => ({ id: v.id, entityLabel: "Vendor", title: v.tradeName, subtitle: v.vendorCode, href: `${ADMIN_ROUTES.vendors}/${v.id}` }));
    },
  },
  {
    key: "requisition",
    permission: "requisitions:read",
    async search(query) {
      const { items } = await requisitionsAdapter.list({ search: query, pageSize: RESULT_LIMIT });
      return items.map((r) => ({ id: r.id, entityLabel: "Requisition", title: r.requisitionNumber, subtitle: r.notes, href: `${ADMIN_ROUTES.requisitions}/${r.id}` }));
    },
  },
  {
    key: "rfq",
    permission: "rfq:read",
    async search(query) {
      const { items } = await rfqAdapter.list({ search: query, pageSize: RESULT_LIMIT });
      return items.map((rfq) => ({ id: rfq.id, entityLabel: "RFQ", title: rfq.rfqNumber, href: `${ADMIN_ROUTES.rfqs}/${rfq.id}` }));
    },
  },
  {
    key: "purchase_order",
    permission: "po:read",
    async search(query) {
      const { items } = await purchaseOrdersAdapter.list({ search: query, pageSize: RESULT_LIMIT });
      return items.map((po) => ({ id: po.id, entityLabel: "Purchase Order", title: po.poNumber, href: `${ADMIN_ROUTES.purchaseOrders}/${po.id}` }));
    },
  },
  {
    key: "grn",
    permission: "grn:read",
    async search(query) {
      const { items } = await grnAdapter.list({ search: query, pageSize: RESULT_LIMIT });
      return items.map((grn) => ({ id: grn.id, entityLabel: "GRN", title: grn.grnNumber, href: `${ADMIN_ROUTES.grn}/${grn.id}` }));
    },
  },
  {
    key: "mrc",
    permission: "mrc:read",
    async search(query) {
      const { items } = await mrcAdapter.list({ search: query, pageSize: RESULT_LIMIT });
      return items.map((mrc) => ({ id: mrc.id, entityLabel: "MRC", title: mrc.mrcNumber, href: `${ADMIN_ROUTES.mrc}/${mrc.id}` }));
    },
  },
];

const CUSTOMER_ENTITIES: GlobalSearchEntityConfig[] = [
  {
    key: "contract",
    permission: "contracts:read",
    async search(query, user) {
      const { items } = await contractsAdapter.list({ search: query, customerId: user.id, pageSize: RESULT_LIMIT });
      return items.map((c) => ({ id: c.id, entityLabel: "Contract", title: c.contractNumber, subtitle: c.title, href: `${PORTAL_ROUTES.contracts}/${c.id}` }));
    },
  },
  {
    key: "mrc",
    permission: "mrc:read",
    async search(query, user) {
      const { items } = await mrcAdapter.list({ search: query, customerId: user.id, pageSize: RESULT_LIMIT });
      return items.map((mrc) => ({ id: mrc.id, entityLabel: "MRC", title: mrc.mrcNumber, href: `${PORTAL_ROUTES.mrc}/${mrc.id}` }));
    },
  },
];

/** Runs every entity search this user's permissions/role cover, in parallel, flattened into one result list. */
export async function runGlobalSearch(query: string, user: CurrentUser): Promise<GlobalSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const isCustomer = user.roles.includes("customer");
  const entities = (isCustomer ? CUSTOMER_ENTITIES : STAFF_ENTITIES).filter((e) => user.permissions.includes(e.permission));

  const results = await Promise.all(entities.map((e) => e.search(trimmed, user)));
  return results.flat();
}
