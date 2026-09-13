"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImagePlaceholder } from "@/components/marketing/image-placeholder";
import { cn } from "@/lib/utils/cn";

export interface PortfolioProject {
  title: string;
  location: string;
  category: "Commercial" | "Residential" | "Interior" | "Ongoing";
  /** Approved project photo, when one exists — see public/images/projects/. */
  image?: string;
}

const FILTERS = ["All Projects", "Commercial", "Residential", "Interior", "Ongoing"] as const;

/**
 * Client component: owns the active-filter state only. Project data is
 * passed in from the server-rendered page (marketing copy, not an API
 * resource yet — the real Project entity/adapter arrives when Project
 * Management ships, Part 13).
 */
export function PortfolioGrid({ projects }: { projects: PortfolioProject[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All Projects");

  const visible =
    filter === "All Projects" ? projects : projects.filter((p) => p.category === filter);

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Filter projects">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              filter === f
                ? "border-brand-red bg-brand-red text-white"
                : "border-border bg-surface text-ink hover:bg-surface-muted",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 text-center text-sm text-ink-muted">
          No projects in this category yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((project) => (
            <Card key={project.title} className="overflow-hidden">
              <ImagePlaceholder
                alt={`${project.title}, ${project.location}`}
                src={project.image}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading text-sm font-semibold text-ink">{project.title}</h3>
                  <Badge variant="brand">{project.category}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{project.location}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
