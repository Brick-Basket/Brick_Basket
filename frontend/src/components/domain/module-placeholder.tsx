import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Shared stub body for every operational route until its owning part ships.
 * Keeps the full route tree in docs/ROUTES.md real and navigable from Part 1
 * onward without inventing screen content ahead of schedule.
 */
export function ModulePlaceholder({
  title,
  part,
  description,
}: {
  title: string;
  part: number;
  description: string;
}) {
  return (
    <div className="p-6 md:p-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>{title}</CardTitle>
            <Badge variant="brand">Part {part}</Badge>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-muted">
            This module is scaffolded (route, layout, permission boundary) but not yet
            implemented. See{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">
              docs/PART_PROMPTS.md
            </code>{" "}
            — Part {part} builds this screen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
