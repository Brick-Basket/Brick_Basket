import type { ReactNode } from "react";

/**
 * Renders a translated heading/paragraph that marks one phrase for the
 * brand-color highlight span using a `{{...}}` marker — e.g. "Building
 * {{Stronger Spaces}} for a Better Tomorrow". Both `UI_TEXT.en` and
 * `UI_TEXT.hi` (`src/lib/i18n/translations.ts`) store their version of a
 * highlighted heading this way, rather than as split `pre`/`highlight`/
 * `post` props, because English and Hindi word order rarely lines up around
 * the same phrase (Hindi is SOV) — a single marked string lets each
 * language's translation choose its own word order freely while still
 * sharing one rendering path. A string with no `{{...}}` marker renders as
 * plain text, unchanged.
 */
export function renderHighlighted(text: string, highlightClassName = "text-brand-red"): ReactNode {
  const match = text.match(/^([\s\S]*?)\{\{([\s\S]*?)\}\}([\s\S]*)$/);
  if (!match) return text;
  const [, pre, mid, post] = match;
  return (
    <>
      {pre}
      <span className={highlightClassName}>{mid}</span>
      {post}
    </>
  );
}
