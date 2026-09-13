# BrickBasket Frontend

Enterprise construction-operations platform frontend + backend-handoff contract, for **BrickBasket**. Built with Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS, shadcn/ui patterns.

## What this repo is

Track A of a two-track delivery. This repo contains:
- The public marketing website.
- The customer portal.
- The internal operations application (leads → contract → vendors → procurement → store → schedule/DPR → finance).
- A `/docs` contract package a separate backend developer/Claude session implements against — see `docs/BACKEND_CLAUDE_HANDOFF.md` (added once module contracts stabilize) and `docs/OPEN_QUESTIONS.md`.

No production backend, database, or auth server lives in this repo. All data access goes through typed adapters in `src/lib/api/adapters`, currently backed by mock data in `src/data/mock`.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
npm run typecheck
```

## Where to look

- Architecture & decisions: `docs/ARCHITECTURE.md`
- Route inventory: `docs/ROUTES.md`
- Module inventory: `docs/MODULES.md`
- Roles/permissions: `docs/ROLES_AND_PERMISSIONS.md`
- Data models: `docs/DATA_MODELS.md`
- Build roadmap (part-by-part prompts): `docs/PART_PROMPTS.md`
- Unresolved business rules: `docs/OPEN_QUESTIONS.md`
- What changed and when: `docs/CHANGELOG.md`

## Design tokens

All brand colors are CSS variables in `src/app/globals.css` (see `--brand-red`, `--brand-charcoal`, etc.) — never hardcode a hex value in a component.
