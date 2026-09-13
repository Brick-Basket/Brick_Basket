"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface FaqItem {
  question: string;
  answer: string;
}

/** Single-open accordion. Keyboard accessible via native <button> + aria-expanded. */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto flex max-w-2xl flex-col divide-y divide-border rounded-card border border-border bg-surface">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-panel-${index}`;
        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-ink hover:text-brand-red"
              >
                {item.question}
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")}
                  aria-hidden
                />
              </button>
            </h3>
            {isOpen && (
              <div id={panelId} className="px-5 pb-4 text-sm text-ink-muted">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
