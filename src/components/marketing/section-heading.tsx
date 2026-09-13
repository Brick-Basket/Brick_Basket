import { cn } from "@/lib/utils/cn";

/** Small red eyebrow + heading pattern reused across every public section. */
export function SectionHeading({
  eyebrow,
  title,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" && "mx-auto max-w-2xl text-center", className)}>
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-red">{eyebrow}</p>
      )}
      <h2 className="mt-2 font-heading text-3xl font-bold text-ink md:text-4xl">{title}</h2>
    </div>
  );
}
