"use client";

import { SectionHeading } from "@/components/marketing/section-heading";
import { useLanguage } from "@/components/providers/language-provider";
import { renderHighlighted } from "@/lib/i18n/highlight";

/**
 * `SectionHeading` wired to `UI_TEXT` by dotted key path — for the two
 * inline headings `page.tsx` builds directly (Services, Projects) rather
 * than through a dedicated section component that could look these up
 * itself. `titleKey`'s string may use the `{{...}}` highlight marker (see
 * `renderHighlighted`); if not, it renders as plain text.
 */
export function TranslatedSectionHeading({
  eyebrowKey,
  titleKey,
  align,
  className,
}: {
  eyebrowKey?: string;
  titleKey: string;
  align?: "center" | "left";
  className?: string;
}) {
  const { t } = useLanguage();
  return (
    <SectionHeading
      eyebrow={eyebrowKey ? t(eyebrowKey) : undefined}
      title={renderHighlighted(t(titleKey))}
      align={align}
      className={className}
    />
  );
}
