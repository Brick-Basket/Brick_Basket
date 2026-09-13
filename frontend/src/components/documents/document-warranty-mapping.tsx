"use client";

import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/domain/empty-state";
import { DOCUMENT_CATEGORY_CONFIG } from "@/components/documents/document-category-config";
import { formatDate } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import type { Document } from "@/types/domain/document";

/**
 * Warranty mapping view required by the module — every warranty-category
 * document alongside what it warranties and when that coverage ends.
 * FRONTEND IMPLEMENTATION DECISION: the owner requirements ask for this
 * view but don't define its data model, so this maps 1 document → 1
 * warranted item via `Document.warrantyItem`/`warrantyExpiresAt` rather
 * than a real warranted-item catalog — see docs/OPEN_QUESTIONS.md.
 */
export function DocumentWarrantyMapping({ documents, onView }: { documents: Document[]; onView: (document: Document) => void }) {
  const { projects: allProjects } = useProjects();
  if (documents.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="No warranty documents match these filters"
        description="Tax invoices and warranted-goods certificates with a mapped item will appear here."
      />
    );
  }

  const now = Date.now();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {documents.map((doc) => {
        const expired = doc.warrantyExpiresAt ? new Date(doc.warrantyExpiresAt).getTime() < now : false;
        return (
          <Card key={doc.id} className="cursor-pointer transition-shadow hover:shadow-lg" onClick={() => onView(doc)}>
            <CardContent className="flex flex-col gap-2 pt-6">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-ink">{doc.warrantyItem ?? "Unmapped item"}</p>
                {doc.warrantyExpiresAt && (
                  <Badge variant={expired ? "error" : "success"}>{expired ? "Expired" : "Active"}</Badge>
                )}
              </div>
              <p className="text-xs text-ink-muted">{DOCUMENT_CATEGORY_CONFIG[doc.category].label}</p>
              <p className="text-sm text-ink-muted">{doc.title}</p>
              <p className="text-xs text-ink-muted">{allProjects.find((p) => p.id === doc.projectId)?.name ?? "—"}</p>
              {doc.warrantyExpiresAt && (
                <p className="text-xs text-ink-muted">
                  {expired ? "Expired" : "Expires"} {formatDate(doc.warrantyExpiresAt)}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
