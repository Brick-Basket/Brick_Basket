"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ADMIN_NAV, PORTAL_NAV } from "@/components/shell/nav-config";

const LABEL_BY_HREF = new Map<string, string>();
for (const group of [...ADMIN_NAV, ...PORTAL_NAV]) {
  for (const item of group.items) LABEL_BY_HREF.set(item.href, item.label);
}

function humanize(segment: string) {
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function Breadcrumbs({ rootHref, rootLabel }: { rootHref: string; rootLabel: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((_, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    return { href, label: LABEL_BY_HREF.get(href) ?? humanize(segments[i]!) };
  });

  return (
    <nav aria-label="Breadcrumb" className="border-b border-border px-4 py-3 md:px-8">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
        <li>
          <Link href={rootHref} className="hover:text-brand-red">
            {rootLabel}
          </Link>
        </li>
        {crumbs.map((crumb, i) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            {i === crumbs.length - 1 ? (
              <span className="font-medium text-ink" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="hover:text-brand-red">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
