import type {
  CreateDocumentInput,
  Document,
  DocumentCategory,
  DocumentVersion,
  UpdateDocumentInput,
  UploadNewVersionInput,
} from "@/types/domain/document";
import { mockDocuments } from "@/data/mock/documents";
import { mockDocumentVersions } from "@/data/mock/document-versions";

/**
 * Adapter boundary for the Document module. Components/hooks depend on
 * this interface, never on the concrete implementation below — swapping
 * to a real backend means adding `documents-adapter.rest.ts` implementing
 * the same interface (minus `getPreviewUrl`, which is a mock-only, in-
 * browser convenience — a real backend serves files by URL directly, no
 * client-side object-URL bookkeeping needed) and changing the single
 * export at the bottom of this file.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 6) for full detail:
 *   GET    /api/documents                    — list, filtered by project/category; customer requests are always additionally filtered to visibleToCustomer=true server-side
 *   GET    /api/documents/:id                — detail
 *   POST   /api/documents                    — create (admin, multipart upload)
 *   PATCH  /api/documents/:id                — edit metadata / visibility (admin)
 *   POST   /api/documents/:id/versions        — upload a new version (admin, multipart)
 *   GET    /api/documents/:id/versions        — version history
 */
export interface DocumentActor {
  id: string;
  name: string;
}

export interface DocumentListParams {
  search?: string;
  category?: DocumentCategory;
  projectId?: string;
  /** Force-filters to only documents visible to a customer — the customer portal always sets this. */
  visibleToCustomer?: boolean;
  /** Restricts to the two warranty categories — backs the Warranty Mapping view. */
  warrantyOnly?: boolean;
  sortBy?: "uploadedAt" | "updatedAt" | "title" | "category";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface DocumentListResult {
  items: Document[];
  total: number;
  page: number;
  pageSize: number;
}

const WARRANTY_CATEGORIES: DocumentCategory[] = ["warranty_tax_invoice", "warranted_goods_certificate"];

export interface DocumentsAdapter {
  list(params?: DocumentListParams): Promise<DocumentListResult>;
  get(id: string): Promise<Document | null>;
  create(input: CreateDocumentInput, file: File | null, actor: DocumentActor): Promise<Document>;
  update(id: string, patch: UpdateDocumentInput, actor: DocumentActor): Promise<Document>;
  uploadNewVersion(id: string, input: UploadNewVersionInput, file: File | null, actor: DocumentActor): Promise<Document>;
  listVersions(documentId: string): Promise<DocumentVersion[]>;
  /**
   * Mock-only convenience: a synchronous, in-memory object URL for a file
   * uploaded during this session (via the browser File API), or `null` for
   * every seeded demo record and after a page reload — there are no real
   * file bytes behind those. Never part of the real backend contract.
   */
  getPreviewUrl(documentId: string): string | null;
}

class MockDocumentsAdapter implements DocumentsAdapter {
  private documents: Document[] = [...mockDocuments];
  private versions: DocumentVersion[] = [...mockDocumentVersions];
  private objectUrls = new Map<string, string>();

  async list(params: DocumentListParams = {}): Promise<DocumentListResult> {
    await delay(300);
    let items = [...this.documents];

    if (params.projectId) items = items.filter((d) => d.projectId === params.projectId);
    if (params.category) items = items.filter((d) => d.category === params.category);
    if (params.visibleToCustomer !== undefined) items = items.filter((d) => d.visibleToCustomer === params.visibleToCustomer);
    if (params.warrantyOnly) items = items.filter((d) => WARRANTY_CATEGORIES.includes(d.category));
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((d) => d.title.toLowerCase().includes(q) || d.fileName.toLowerCase().includes(q));
    }

    const sortBy = params.sortBy ?? "uploadedAt";
    const sortDir = params.sortDir ?? "desc";
    items.sort((a, b) => {
      const av = a[sortBy] ?? "";
      const bv = b[sortBy] ?? "";
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    const total = items.length;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page, pageSize };
  }

  async get(id: string): Promise<Document | null> {
    await delay(200);
    return this.documents.find((d) => d.id === id) ?? null;
  }

  async create(input: CreateDocumentInput, file: File | null, actor: DocumentActor): Promise<Document> {
    await delay(500);
    const now = new Date().toISOString();
    const document: Document = {
      id: `doc_${Math.random().toString(36).slice(2, 10)}`,
      title: input.title,
      category: input.category,
      projectId: input.projectId,
      fileName: input.fileName,
      fileType: input.fileType,
      fileSizeBytes: input.fileSizeBytes,
      version: 1,
      uploadedBy: actor.id,
      uploadedByName: actor.name,
      uploadedAt: now,
      updatedAt: now,
      visibleToCustomer: input.visibleToCustomer,
      warrantyItem: input.warrantyItem,
      warrantyExpiresAt: input.warrantyExpiresAt,
    };
    this.documents = [document, ...this.documents];
    if (file) this.objectUrls.set(document.id, URL.createObjectURL(file));
    return document;
  }

  async update(id: string, patch: UpdateDocumentInput, _actor: DocumentActor): Promise<Document> {
    await delay(350);
    const document = this.mustFind(id);
    const updated: Document = { ...document, ...patch, updatedAt: new Date().toISOString() };
    this.replace(updated);
    return updated;
  }

  async uploadNewVersion(id: string, input: UploadNewVersionInput, file: File | null, actor: DocumentActor): Promise<Document> {
    await delay(500);
    const document = this.mustFind(id);

    // Archive the version being superseded before overwriting it.
    const supersededVersion: DocumentVersion = {
      id: `docver_${Math.random().toString(36).slice(2, 10)}`,
      documentId: id,
      version: document.version,
      fileName: document.fileName,
      fileType: document.fileType,
      fileSizeBytes: document.fileSizeBytes,
      uploadedBy: document.uploadedBy,
      uploadedByName: document.uploadedByName,
      uploadedAt: document.uploadedAt,
    };
    if (!this.versions.some((v) => v.documentId === id && v.version === document.version)) {
      this.versions = [supersededVersion, ...this.versions];
    }

    const now = new Date().toISOString();
    const updated: Document = {
      ...document,
      version: document.version + 1,
      fileName: input.fileName,
      fileType: input.fileType,
      fileSizeBytes: input.fileSizeBytes,
      uploadedBy: actor.id,
      uploadedByName: actor.name,
      uploadedAt: now,
      updatedAt: now,
    };
    this.replace(updated);

    const newVersionEntry: DocumentVersion = {
      id: `docver_${Math.random().toString(36).slice(2, 10)}`,
      documentId: id,
      version: updated.version,
      fileName: updated.fileName,
      fileType: updated.fileType,
      fileSizeBytes: updated.fileSizeBytes,
      uploadedBy: actor.id,
      uploadedByName: actor.name,
      uploadedAt: now,
      note: input.note,
    };
    this.versions = [newVersionEntry, ...this.versions];

    if (file) {
      const existing = this.objectUrls.get(id);
      if (existing) URL.revokeObjectURL(existing);
      this.objectUrls.set(id, URL.createObjectURL(file));
    }

    return updated;
  }

  async listVersions(documentId: string): Promise<DocumentVersion[]> {
    await delay(250);
    return this.versions.filter((v) => v.documentId === documentId).sort((a, b) => b.version - a.version);
  }

  getPreviewUrl(documentId: string): string | null {
    return this.objectUrls.get(documentId) ?? null;
  }

  private mustFind(id: string): Document {
    const document = this.documents.find((d) => d.id === id);
    if (!document) throw new Error("Document not found.");
    return document;
  }

  private replace(updated: Document) {
    this.documents = this.documents.map((d) => (d.id === updated.id ? updated : d));
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const documentsAdapter: DocumentsAdapter = new MockDocumentsAdapter();
