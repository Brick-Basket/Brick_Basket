import { cn } from "@/lib/utils/cn";

/** Small red eyebrow + heading pattern reused across every public section. */
export function SectionHeading({
  eyebrow,
  title,
  align = "center",
  className,
  titleClassName,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  align?: "center" | "left";
  className?: string;
  /**
   * Optional override appended to the `<h2>`'s own classes — added so one
   * section can recolor its own heading (e.g. Why Us's "Why Choose
   * BrickBasket?" in brand red) without changing the default `text-ink`
   * color every other section's heading still uses through this same
   * shared component.
   */
  titleClassName?: string;
}) {
  return (
    <div className={cn(align === "center" && "mx-auto max-w-2xl text-center", className)}>
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-red">{eyebrow}</p>
      )}
      {/* leading-snug (not Tailwind's tighter text-3xl/4xl defaults) — same
          Devanagari-overlap reasoning as HeroSection's h1: these headings
          are usually one line, but a longer Hindi title can wrap, and
          Devanagari's taller matras/conjuncts need more per-line room than
          Latin text does. See docs/CHANGELOG.md. */}
      <h2 className={cn("mt-2 font-heading text-3xl font-bold leading-snug text-ink md:text-4xl", titleClassName)}>
        {title}
      </h2>
    </div>
  );
}
