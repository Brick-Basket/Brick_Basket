import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Stand-in for a real photograph on the public site, until approved
 * project/brand imagery is supplied — and, once a `src` is passed, the one
 * place that real photo actually renders.
 *
 * FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase
 * 7): the public site's project cards, About page, and Why Us page each
 * independently rendered a bare `<div className="aspect-[4/3] bg-border" />`
 * wherever a real photo should go — visually indistinguishable from "we
 * forgot to add an image" and giving no signal to a future editor that a
 * real photo belongs there. This component replaces every one of those
 * ad-hoc divs with something that (a) makes clear, on screen, that this is
 * an intentional placeholder when no photo exists yet, and (b) is the one
 * place a real `next/image` gets wired in once approved photography exists.
 *
 * FRONTEND IMPLEMENTATION DECISION (image-insertion pass): `src` is now
 * wired in — every call site that has an approved photo (see
 * `public/images/`, sourced from the owner's Company Profile deck) passes
 * one, and this component renders it with `next/image`. Call sites with no
 * approved photo yet (e.g. the Contact section's office map — none of the
 * supplied material is an actual map) keep omitting `src` and still render
 * the dashed placeholder box below, so it's still obvious at a glance which
 * slots are real and which are pending. See docs/OPEN_QUESTIONS.md #46.
 */
export function ImagePlaceholder({
  alt,
  aspect = "4/3",
  className,
  src,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
}: {
  /** Describes what photo belongs here — used as the accessible label/alt text either way. */
  alt: string;
  aspect?: "4/3" | "16/9" | "1/1";
  className?: string;
  /** A real photo path (e.g. "/images/hero-building.jpg"). Omit to keep showing the placeholder box. */
  src?: string;
  /** Forwarded to next/image; tune per call site for accurate responsive loading. */
  sizes?: string;
  /** Forwarded to next/image — set true only for an above-the-fold image (e.g. the hero). */
  priority?: boolean;
}) {
  const aspectClass =
    aspect === "4/3" ? "aspect-[4/3]" : aspect === "16/9" ? "aspect-[16/9]" : "aspect-square";

  if (src) {
    return (
      <div className={cn("relative w-full overflow-hidden rounded-card", aspectClass, className)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "flex w-full items-center justify-center rounded-card border border-dashed border-border bg-surface-muted text-ink-muted",
        aspectClass,
        className,
      )}
    >
      <ImageIcon className="h-8 w-8 opacity-40" aria-hidden />
    </div>
  );
}
