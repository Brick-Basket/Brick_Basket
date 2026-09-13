"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { VENDOR_CODE_SERIES_CONFIG, VENDOR_NATURE_CONFIG, VENDOR_GST_CATEGORY_CONFIG } from "@/components/vendors/vendor-config";
import { formatRating } from "@/components/vendors/vendor-rating";
import { formatINR } from "@/lib/utils/format";
import type { VendorListItem } from "@/lib/api/adapters/vendors-adapter";

export function VendorTable({
  vendors,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  vendors: VendorListItem[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  onView: (vendor: VendorListItem) => void;
}) {
  const columns: DataTableColumn<VendorListItem>[] = [
    {
      key: "tradeName",
      header: "Vendor",
      sortKey: "tradeName",
      render: (v) => (
        <div>
          <p className="font-medium text-ink">{v.tradeName}</p>
          <p className="text-xs text-ink-muted">{v.contactPerson}</p>
        </div>
      ),
    },
    {
      key: "vendorCode",
      header: "Code",
      sortKey: "vendorCode",
      render: (v) => (
        <div>
          <p className="font-mono text-sm text-ink">{v.vendorCode}</p>
          <p className="text-xs text-ink-muted">Series {VENDOR_CODE_SERIES_CONFIG[v.codeSeriesCategory].seriesNumber}</p>
        </div>
      ),
    },
    {
      key: "nature",
      header: "Nature",
      render: (v) => VENDOR_NATURE_CONFIG[v.nature].label,
    },
    {
      key: "gst",
      header: "GST",
      hideOnMobile: true,
      render: (v) => <Badge variant={v.gstCategory === "registered" ? "success" : "neutral"}>{VENDOR_GST_CATEGORY_CONFIG[v.gstCategory].label}</Badge>,
    },
    {
      key: "rating",
      header: "Rating",
      sortKey: "averageRating",
      render: (v) => (
        <div>
          <p className="text-ink">{formatRating(v.averageRating)}</p>
          {v.assessmentCount > 0 && (
            <p className="text-xs text-ink-muted">
              {v.assessmentCount} assessment{v.assessmentCount === 1 ? "" : "s"}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "turnover",
      header: "Turnover",
      hideOnMobile: true,
      render: (v) => formatINR(v.turnover),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={vendors}
      keyFor={(v) => v.id}
      sortBy={sortBy}
      sortDir={sortDir}
      onSortChange={onSortChange}
      onRowClick={onView}
    />
  );
}
