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
