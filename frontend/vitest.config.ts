import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Minimal Vitest config — added post-Part-20 stabilization pass (Phase 18),
 * resolving `docs/OPEN_QUESTIONS.md` #41(e) / `docs/TESTING.md`'s "no
 * automated tests exist" finding. `vitest` was already a devDependency
 * (added Phase 1/22 of this same stabilization pass) but had no config file
 * and no test files — see `docs/CHANGELOG.md`. Only the `@/*` path alias
 * needs restating here (Vitest/Vite doesn't read `tsconfig.json`'s `paths`
 * on its own without an extra plugin, and this sandbox has no npm registry
 * access to install one — see every other "no network access" note in this
 * pass's `docs/CHANGELOG.md` entry).
 *
 * **Verification note, updated after the first real run outside this
 * sandbox** (this environment still has no npm registry access, so `vitest
 * run` has still never executed here — see docs/CHANGELOG.md's "Real
 * build/test verification pass"). When the owner ran `npm test` locally,
 * every pure-math assertion passed as hand-traced; the only failures were
 * (a) one test in `dpr-work-item-math.test.ts` that queried the wrong
 * work-item id for what it meant to assert (fixed — the underlying function
 * was already correct), and (b) 11 adapter-workflow tests that don't fail
 * on assertions at all — they hit Vitest's default 5000ms per-test timeout,
 * because `test-fixtures.ts` composes several real adapter calls end-to-end
 * (Requisition → RFQ → PO → GRN/MRC/Cost-to-Complete), each with its own
 * simulated network `delay()`, and the total for the longest chains runs to
 * ~6-7 seconds. `testTimeout` below is raised accordingly — no production
 * adapter logic changed.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Generous headroom over the ~6-7s worst-case chained-fixture cost
    // above (see the note above) — not tuned to a razor's edge, since a
    // slower CI machine shouldn't turn a passing suite flaky.
    testTimeout: 20000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
