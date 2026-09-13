import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ESLint 9 only loads flat config (`eslint.config.*`) — it no longer reads
// `.eslintrc.json` at all, which is why `npm run lint` failed with "ESLint
// couldn't find an eslint.config.(js|mjs|cjs) file" even though
// `.eslintrc.json` (extending `next/core-web-vitals`/`next/typescript`) was
// still sitting right next to it. `eslint-config-next` doesn't yet ship its
// own flat-config export for the pinned Next 15.5.24, so this uses the
// standard Next.js-documented migration path: `FlatCompat` translates the
// same two legacy-style `extends` entries into flat config. `.eslintrc.json`
// is left in place as a harmless historical reference — ESLint 9 ignores it
// once this file exists — rather than deleted, so a diff of "what changed"
// stays visible.
//
// `.mjs` (not `.js`) is deliberate: `package.json` has no `"type": "module"`
// field, so a plain `.js` file here would be parsed as CommonJS and fail on
// this `import` syntax. `.mjs` forces ESM regardless of that field, without
// changing how any other file in the project is parsed.
const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // `next-env.d.ts` is auto-generated and re-written by Next.js itself on
    // every `next dev`/`next build` — its triple-slash reference is Next's
    // own required syntax, not something this project's code style governs.
    ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts"],
  },
  {
    rules: {
      // This codebase's own convention (every mock adapter's `_actor`
      // parameter — kept only to satisfy the shared interface a real
      // `*-adapter.rest.ts` will actually use) is a leading underscore for
      // "intentionally unused." Recognize that convention instead of
      // flagging ~30 deliberate no-ops across the adapters as warnings.
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
];

export default eslintConfig;
