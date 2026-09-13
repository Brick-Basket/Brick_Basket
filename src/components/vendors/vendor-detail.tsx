"use client";

import { useState } from "react";
import { ClipboardPlus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useVendor } from "@/hooks/use-vendors";
import { VENDOR_CODE_SERIES_CONFIG, VENDOR_GST_CATEGORY_CONFIG, VENDOR_NATURE_CONFIG } from "@/components/vendors/vendor-config";
import { VendorRatingSummary } from "@/components/vendors/vendor-rating-summary";
import { VendorAssessmentForm } from "@/components/vendors/vendor-assessment-form";
import { VendorAssessmentHistory } from "@/components/vendors/vendor-assessment-history";
import { VendorPastWork } from "@/components/vendors/vendor-past-work";
import { formatINR } from "@/lib/utils/format";

export function VendorDetail({ vendorId, onEdit }: { vendorId: string; onEdit: () => void }) {
  const { status, error, vendor, assessments, pastWork, refetch } = useVendor(vendorId);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-3">
        <LoadingSkeleton className="h-32 w-full" />
        <LoadingSkeleton className="h-48 w-full" />
      </div>
    );
  }

  if (status === "error") {
    return <ErrorState title="Could not load this vendor" description={error ?? undefined} onRetry={refetch} />;
  }

  if (!vendor) {
    return <ErrorState title="Vendor not found" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-heading text-2xl font-semibold text-ink">{vendor.tradeName}</h1>
              <p className="font-mono text-sm text-ink-muted">
                {vendor.vendorCode} · Series {VENDOR_CODE_SERIES_CONFIG[vendor.codeSeriesCategory].seriesNumber} — {VENDOR_CODE_SERIES_CONFIG[vendor.codeSeriesCategory].label}
              </p>
            </div>
            <PermissionGuard permission="vendors:write">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4" aria-hidden />
                Edit
              </Button>
            </PermissionGuard>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="brand">{VENDOR_NATURE_CONFIG[vendor.nature].label}</Badge>
            <Badge variant={vendor.gstCategory === "registered" ? "success" : "neutral"}>{VENDOR_GST_CATEGORY_CONFIG[vendor.gstCategory].label}</Badge>
            {vendor.msmeUdyamNumber && <Badge variant="neutral">MSME/UDYAM registered</Badge>}
          </div>

          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-ink-muted">Contact Person</dt>
              <dd className="text-ink">
                {vendor.contactPerson} — {vendor.contactPersonDesignation}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Email / Phone</dt>
              <dd className="text-ink">
                {vendor.email} · {vendor.contactNumber}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-ink-muted">Address</dt>
              <dd className="text-ink">{vendor.address}</dd>
            </div>
            {vendor.gstin && (
              <div>
                <dt className="text-xs text-ink-muted">GSTIN</dt>
                <dd className="text-ink">{vendor.gstin}</dd>
              </div>
            )}
            {vendor.msmeUdyamNumber && (
              <div>
                <dt className="text-xs text-ink-muted">MSME/UDYAM Number</dt>
                <dd className="text-ink">{vendor.msmeUdyamNumber}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-ink-muted">Turnover</dt>
              <dd className="text-ink">{formatINR(vendor.turnover)} / year</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <VendorRatingSummary assessments={assessments} />

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-center justify-between">
            <p className="font-heading text-sm font-semibold text-ink">Assessment History</p>
            <PermissionGuard permission="vendors:assess">
              <Button variant="outline" size="sm" onClick={() => setShowAssessmentForm((v) => !v)}>
                <ClipboardPlus className="h-4 w-4" aria-hidden />
                New Assessment
              </Button>
            </PermissionGuard>
          </div>
          {showAssessmentForm && (
            <VendorAssessmentForm
              vendor={vendor}
              onCancel={() => setShowAssessmentForm(false)}
              onSuccess={() => {
                setShowAssessmentForm(false);
                refetch();
              }}
            />
          )}
          <VendorAssessmentHistory assessments={assessments} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <VendorPastWork vendorId={vendor.id} entries={pastWork} onAdded={refetch} />
        </CardContent>
      </Card>
    </div>
  );
}
