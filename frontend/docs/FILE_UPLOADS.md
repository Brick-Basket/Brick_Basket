# FILE UPLOADS

Populated in Part 6 (Drawing & Document Management), the first module that handles files. Covers document categories, upload/version metadata, the preview/download boundary, and what's still open pending backend/client confirmation.

## Document categories (confirmed, non-configurable)

Unlike Lead's pipeline stages or Contract's line-item categories, the six document categories below are **owner-confirmed verbatim** from the requirements — not a frontend placeholder, not configurable. Source of truth: `src/types/domain/document.ts`'s `DocumentCategory` union and `src/components/documents/document-category-config.ts`.

| Value | Label (UI) |
|---|---|
| `finalized_drawing` | Finalized Drawing |
| `layout_2d` | 2D Layout |
| `layout_3d` | 3D Layout |
| `material_test_certificate` | Material Test Certificate |
| `warranty_tax_invoice` | Warranty Tax Invoice |
| `warranted_goods_certificate` | Warranted Goods Certificate |

The last two are the "warranty categories" — they're the only ones that populate `Document.warrantyItem`/`warrantyExpiresAt` and appear in the Warranty Mapping view.

## Upload flow (mock)

There is no real backend or file storage in this frontend build. `DocumentsAdapter.create`/`uploadNewVersion` accept an optional real browser `File` object alongside the required metadata (title, category, project, visibility, warranty fields where applicable):

- If a real file is chosen in the upload form, the adapter stores `URL.createObjectURL(file)` in an in-memory `Map<documentId, string>` inside the adapter singleton (`getPreviewUrl(documentId)`), and Preview/Download work against that object URL for the rest of the session.
- If no file is chosen (or after a page reload, since object URLs and the in-memory map don't survive one), Preview and Download show an explicit "no file on record" state — never a fake preview. Every **seeded** demo document (`src/data/mock/documents.ts`) is in this state, since none of them have ever had a real file behind them.
- `getPreviewUrl` is explicitly documented in the adapter as mock-only — it has no equivalent in the real backend contract below, where a document simply has a servable file URL from the moment it's created.

## Preview boundary

`DocumentPreviewPanel` (`src/components/documents/document-preview-panel.tsx`) renders a preview without committing to any PDF/image rendering library:

- `image/*` → a plain `<img src={previewUrl}>`.
- `application/pdf` → a plain `<iframe src={previewUrl}>`, relying on the browser's own native PDF viewer.
- Anything else, or no `previewUrl` → a "preview not available, use Download" message.

This satisfies the module's requirement for "a preview modal boundary" without adding an unverified dependency (e.g. `pdf.js`/`react-pdf`) ahead of a real backend that will serve real files.

## Open items (frontend cannot resolve these — see `docs/OPEN_QUESTIONS.md`)

- **#8 — File storage provider, per-category max file size, allowed file types.** Not implemented: the mock upload form accepts any file via a native `<input type="file">` with no client-side size/type validation, since no limits have been confirmed. When the real backend and storage provider are chosen, add validation here matching whatever limits are set, and document them in the table below (currently empty — TBD).

  | Category | Max size | Allowed types |
  |---|---|---|
  | *(all categories)* | TBD | TBD |

- **#9 — Versioning and deletion/archive rules.** Implemented today: uploading a new version bumps `Document.version` by 1 and archives the superseded version's metadata into a separate `DocumentVersion[]` history (`DocumentsAdapter.uploadNewVersion` — see `docs/DATA_MODELS.md`), shown newest-first in `DocumentVersionHistory`. There is **no delete/archive action anywhere in this module** — no owner requirement or client confirmation names one, so none was invented. If documents need to be deleted or archived (as opposed to superseded by a new version), that needs a confirmed rule before it's built.

## Backend contract

See `docs/API_CONTRACTS.md` (Document Management section) for the full endpoint list this module's adapter mocks — list/detail/create/update/version-upload/version-history, all under the `documents:read`/`documents:write` permissions already defined in Part 3.

---

# Site Updates media (Site Updates module, post-Part-20)

Second module in this app that handles files, added for the daily photo/video upload feature (`src/types/domain/site-update.ts`, see `docs/OPEN_QUESTIONS.md` #68). Same mock convention as Document Management above: `SiteUpdatesAdapter.create` accepts real browser `File[]`, stores `URL.createObjectURL(file)` per media item in an in-memory `Map<mediaId, string>` (`getPreviewUrl(mediaId)`), and every seeded demo update shows an explicit "no file on record" state per tile — never a fake preview. The mock upload form has **no client-side size/type validation today**, matching Document Management's own gap (#8) — same reason: no limits have been confirmed yet.

## #69 — Proposed size limits, storage architecture, and platform choice (frontend proposal, not owner/backend-confirmed)

Asked directly what the size limits should be and how this should be managed in a real backend. Nothing here is implemented — this is a concrete starting recommendation for the owner/backend team to confirm or override, following the same "flag it, don't silently invent it as fact" rule as everywhere else in this repo.

**Recommended size limits** (reasoning: typical phone-camera output, kept generous enough not to block a legitimate site photo/video, capped enough that one upload can't stall on a weak site connection or blow up storage cost):

| Media | Recommended max per file | Why |
|---|---|---|
| Photo | 15 MB | Covers a full-resolution phone photo (JPEG/HEIC), including a 48MP shot; blocks an accidental huge scan/RAW file |
| Video | 200 MB | Covers a 1–3 minute 1080p clip at typical phone bitrates; a 4K clip or anything longer should be downscaled/trimmed before upload, not accommodated by raising this limit |
| Video length | 3 minutes (soft cap, enforced in the upload UI, not just by bytes) | This feature is a quick daily walkthrough clip, not a long recording — a hard duration cap keeps files small without needing to know the exact bitrate |
| Per update (combined) | 10 files / 300 MB total | Keeps one "day's update" to a reasonable batch; post a second update the same day if there's more to share, rather than one huge one |
| Accepted types | `image/jpeg`, `image/png`, `image/heic`, `image/webp`, `video/mp4`, `video/quicktime` | The common phone-camera output formats; anything else (e.g. a raw `.mov` variant that isn't web-playable, or a non-media file) should be rejected client-side with a clear message |

## How this should be managed in a real backend (proposed)

**Never route file bytes through the application server or database.** The current mock is a stand-in for a proper direct-to-storage flow:

1. Client asks the backend to create the update record (metadata only — remarks, date, project, visibility) and, for each attached file, requests an upload slot. The backend validates the *declared* file type/size against the table above and, if acceptable, returns a short-lived presigned upload URL per file (e.g. an S3 presigned `PUT`, an Azure SAS token, or a GCS signed URL) — never a route that accepts the raw file body itself.
2. The client uploads each file **directly to object storage** using that presigned URL. For anything above a few MB (every video, and some photos), this should use a resumable/multipart upload (S3 multipart upload, or the `tus` protocol) rather than one single `PUT` — site engineers are often on weak mobile signal, and a dropped connection on a 150 MB video should resume, not restart from zero.
3. The client confirms completion to the backend; the backend verifies the object actually landed (a `HEAD` request against storage) and records the *real* size/content-type read back from storage — never trusting whatever the client claimed at step 1.
4. The backend enqueues an async processing job (triggered off the storage bucket's "object created" event, or a queue) rather than blocking the upload response on it:
   - **Photos**: generate a small grid-thumbnail derivative (~400px) and a detail-view derivative (~1600px); the grid should never serve the original full-resolution file. The original stays available for "Download."
   - **Videos**: transcode to a single web-friendly format (H.264 MP4, capped at 1080p regardless of what was uploaded) and generate a poster-frame thumbnail for the grid tile. Adaptive-bitrate/HLS streaming is almost certainly overkill for 3-minute internal update clips and can be skipped unless video volume grows much larger than expected.
   - While processing is in flight, the UI should show a "processing" state on that tile rather than the final asset (this implies adding a `status` field to `SiteUpdateMedia` once a real backend exists — not added to the frontend type yet, since it would be speculative ahead of the backend decision).
5. Serve every derivative through a **CDN** in front of the storage bucket, with long cache lifetimes (media here is immutable once posted, see `docs/DATA_MODELS.md`). Given the likely audience (site staff and customers on Indian mobile networks), a CDN with good India edge coverage matters for load times — AWS CloudFront (pairs naturally with S3, has a Mumbai edge location) or Cloudflare (works in front of any origin, strong India presence, generous free tier) are both reasonable defaults.
6. **Access control is not just the UI toggle.** `visibleToCustomer: false` must not simply be hidden in the app while the underlying file URL is still guessable/public — the storage/CDN layer needs to actually enforce it (signed, time-limited URLs issued only to an authorized session, or a private bucket read through an authenticated proxy), the same "UX-layer defense only" caveat this repo already states for `PermissionGuard` (`docs/ROLES_AND_PERMISSIONS.md`).

## Platform choice — two reasonable paths, needs an owner/backend decision

- **DIY, cloud-native (AWS-centric example)**: S3 (storage) + CloudFront (CDN) + presigned URLs for upload + Sharp (self-hosted, e.g. in a Lambda) for image resizing + MediaConvert or Elastic Transcoder for video transcoding. Cheapest at scale, most control, but the most backend/ops work to build and maintain — a real engineering investment beyond just "add an upload button."
- **Managed media platform (e.g. Cloudinary, or similarly ImageKit/Mux for video specifically)**: handles upload, storage, resizing/format conversion (via URL parameters, no custom resize code), transcoding, and CDN delivery as one product. Meaningfully less backend code to write and operate, at a recurring subscription cost that scales with usage. Given this project's frontend-only build has no backend team assembled yet, this is very likely the faster path to a working, reliable feature — worth strongly considering over the DIY path unless there's already committed AWS/Azure/GCP infrastructure this should plug into.

Either path should still follow the direct-to-storage + async-processing flow above; the difference is how much of that pipeline is hand-built versus provided by the platform. **This choice, the final size limits, and which formats to accept are all backend/owner decisions, not something the frontend can resolve on its own** — tracked as an extension of #8 in `docs/OPEN_QUESTIONS.md` (see #69).

## Backend contract

See `docs/API_CONTRACTS.md` (Site Updates section) for the confirmed-shape mock contract (`GET`/`POST`/`PATCH /api/site-updates`), and the proposed production upload flow above for what a real implementation should add on top of it (presigned-upload endpoints aren't in the mock contract yet, since the mock has no real storage to presign against).
