/** Lightweight stub for public pages not yet built (Part 2). */
export function PublicPagePlaceholder({ title, part }: { title: string; part: number }) {
  return (
    <section className="container py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-red">
        BrickBasket
      </p>
      <h1 className="mt-2 font-heading text-3xl font-bold text-ink md:text-4xl">{title}</h1>
      <p className="mx-auto mt-4 max-w-md text-ink-muted">
        This page is scaffolded and routed but its content ships in Part {part} of the build
        roadmap (see docs/PART_PROMPTS.md).
      </p>
    </section>
  );
}
