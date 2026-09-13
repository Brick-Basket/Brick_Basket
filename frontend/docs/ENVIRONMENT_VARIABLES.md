# Environment Variables

| Variable | Used by | Required | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `src/app/layout.tsx` (`metadataBase`, Open Graph) | No — falls back to `https://www.brickbasket.co.in` | Placeholder domain, not confirmed — see `docs/OPEN_QUESTIONS.md` #17. Set this to the real production domain before launch. |

No backend/API base URL exists yet — every data-access call goes through a mock adapter (`src/lib/api/adapters/*`, `src/lib/auth/auth-adapter.ts`). When a real backend is available, expect at minimum an `NEXT_PUBLIC_API_BASE_URL` (or server-only equivalent) to be added here alongside the REST adapter implementations described in `docs/ARCHITECTURE.md` section G.

No secrets are used or required by the frontend. Per the master prompt's engineering principles, no secret/backend credential should ever be added to a `NEXT_PUBLIC_*` variable or committed to this repo.
