# Module Inventory

**Implementation status legend** (BrickBasket final hardening pass — P2 documentation cleanup, replacing the previous bare "Part N" status with an explicit category per module):

- **IMPLEMENTED** — full UI + mock-adapter workflow built against the owner's specification, no known frontend-side gap.
- **PARTIALLY IMPLEMENTED** — the UI/workflow is built and usable, but a named, documented gap remains between what the mock adapter does and what a real backend must do (see the module's own note below and its `docs/API_CONTRACTS.md`/`docs/OPEN_QUESTIONS.md` entries) — most often because the mock takes a shortcut a real backend transaction cannot.
- **PENDING OWNER SPECIFICATION** — deliberately not built beyond a placeholder, because the owner has not yet confirmed the business rules needed to build it for real.

Every module below, IMPLEMENTED or not, is also **MOCK ONLY / BACKEND REQUIRED**: this entire application runs against in-memory mock adapters with no real persistence, so every row needs a real backend before it is production-ready — that's true universally and isn't repeated per row. See `docs/API_INTEGRATION_GUIDE.md` for the adapter-by-adapter cutover plan and `docs/BACKEND_CLAUDE_HANDOFF.md` for the full handoff.

| # | Module | Primary roles | Routes | Part | Implementation status |
|---|---|---|---|---|---|
| 0 | Public Website | anonymous | `(public)/*` | Part 2 | IMPLEMENTED |
| 1 | Auth & App Shell | all | `/login`, shells | Part 3 | IMPLEMENTED — see `docs/AUTHENTICATION.md`'s own limitation note (client-side-only session, no real backend verification) |
| 2 | Lead Management | admin, project_manager | `/admin/leads` | Part 4 | IMPLEMENTED |
| 3 | Contract Management | admin, customer | `/admin/contracts`, `/dashboard/contracts` | Part 5 | IMPLEMENTED |
| 4 | Drawing & Document Management | admin, customer | `/admin/documents`, `/dashboard/documents` | Part 6 | IMPLEMENTED |
| 5 | Vendor Management | admin, purchaser | `/admin/vendors` | Part 7 | IMPLEMENTED |
| 6a | Supply Chain — ACE | admin, project_manager | `/admin/supply-chain/ace` | Part 8 | IMPLEMENTED |
| 6b | Supply Chain — Requisition | project_manager, admin | `/admin/supply-chain/requisitions` | Part 8 | IMPLEMENTED |
| 6c | Supply Chain — RFQ | purchaser, admin | `/admin/supply-chain/rfqs` | Part 9 | IMPLEMENTED |
| 6d | Purchase Orders | purchaser, approver, admin | `/admin/purchase-orders` | Part 10 | IMPLEMENTED |
| 7a | Store — GRN | store_personnel, admin | `/admin/stores/grn` | Part 11 | IMPLEMENTED |
| 7b | Store — Stock Statement | store_personnel, admin | `/admin/stores/stock` | Part 11 | IMPLEMENTED |
| 7c | Store — Wastage | store_personnel, admin | `/admin/stores/wastage` | Part 11 | IMPLEMENTED |
| 7d | Store — MRC | store_personnel, customer | `/admin/stores/mrc`, `/dashboard/mrc` | Part 12 | IMPLEMENTED |
| 7e | Store — Material Requisition (MR, §6B) | store_personnel, project_manager, admin | `/admin/stores/requisitions` | stabilization pass, Phase 2 | PARTIALLY IMPLEMENTED — `issue()` only flips this record's own status/`issueDate`; the real stock-consumption transaction is documented, not implemented (see `docs/API_CONTRACTS.md`'s `/issue` section and `docs/OPEN_QUESTIONS.md` #54) |
| 8a | Project Management — Schedule | project_manager | `/admin/project-management/schedule` | Part 13 | IMPLEMENTED |
| 8b | Project Management — DPR | project_manager, site_engineer | `/admin/project-management/dpr` | Part 14 | PARTIALLY IMPLEMENTED — the DPR→Schedule progress linkage (including the final hardening pass's reconciliation fix) is a frontend-computed mechanism standing in for a real backend transaction; see `docs/OPEN_QUESTIONS.md` #35 and #55 |
| 9a | Finance — Project Cost Accounting | finance, admin | `/admin/finance/project-cost` | Part 15 | IMPLEMENTED |
| 9b | Finance — Payments & Receipts | finance, admin | `/admin/finance/payments`, `/dashboard/payments` | Part 16 | IMPLEMENTED |
| 9c | Finance — Bank & Cash | finance | `/admin/finance/bank-cash` | Part 16 | IMPLEMENTED |
| 9d | Finance — Taxes & Statutory | finance | `/admin/finance/taxes` | Part 17 | IMPLEMENTED |
| 9e | Finance — Fixed Assets | finance | `/admin/finance/fixed-assets` | Part 17 | IMPLEMENTED |
| 9f | Finance — GSTR | finance | `/admin/finance/gstr` | Part 17 | IMPLEMENTED |
| 9g | Finance — Cost-to-Complete | finance, admin | `/admin/finance/cost-to-complete` | Part 18 | PARTIALLY IMPLEMENTED — a pure client-computed aggregate with no persisted record of its own; the owner's "supply vs. service & composite works" split is not implemented (see `docs/OPEN_QUESTIONS.md` #39) |
| 9h | Cost Management (placeholder) | admin | `/admin/cost-management` | Part 18 | PENDING OWNER SPECIFICATION — see `docs/OPEN_QUESTIONS.md` #4 |

Parts 19 and 20 added no new module/route — Part 19 (Cross-Module Polish) is cross-cutting work on top of the modules above (Notifications, Ops Dashboard metrics, Global Search, Audit Timeline consolidation, an accessibility pass — see `docs/NOTIFICATIONS.md`, `docs/COMPONENT_GUIDE.md`), and Part 20 (Final Backend Handoff Package) is documentation-only. Both are recorded in `docs/CHANGELOG.md` and `docs/PART_PROMPTS.md` rather than as rows here. The BrickBasket final hardening pass (see `docs/CHANGELOG.md`) added no new module either — it hardened, tested and documented the modules already listed above, and added row 7e (the post-Part-20 stabilization pass's Store Material Requisition module, previously missing from this table).
