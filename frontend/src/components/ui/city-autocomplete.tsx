"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { searchIndianCities, type IndianCity } from "@/data/reference/indian-cities";

/**
 * Shared "type a few letters, pick the city from a pop-up list" control —
 * built for Lead Management correction #7 and Contract Management
 * correction #6, which both ask for the same interaction. Not a hard
 * picker: the field stays a normal free-text input (`value`/`onValueChange`)
 * so a city missing from the curated list (see
 * `src/data/reference/indian-cities.ts`) can still be typed by hand;
 * `onSelectCity` fires only when a suggestion is actually chosen, which is
 * how `ContractForm` also captures the matching state for the new contract
 * reference number format.
 */
export function CityAutocomplete({
  id,
  value,
  onValueChange,
  onSelectCity,
  placeholder = "Start typing a city…",
  invalid,
  disabled,
  ariaLabel,
}: {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelectCity?: (city: IndianCity) => void;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestions = open ? searchIndianCities(value) : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectCity = (city: IndianCity) => {
    onValueChange(city.city);
    onSelectCity?.(city);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const city = suggestions[activeIndex];
      if (city) selectCity(city);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const listboxId = id ? `${id}-listbox` : undefined;

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        invalid={invalid}
        disabled={disabled}
        onChange={(e) => {
          onValueChange(e.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {open && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-card"
        >
          {suggestions.map((city, index) => (
            <li key={`${city.city}-${city.state}`} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectCity(city)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                  index === activeIndex ? "bg-surface-muted" : "hover:bg-surface-muted",
                )}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden />
                <span className="text-ink">{city.city}</span>
                <span className="text-xs text-ink-muted">{city.state}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && value.trim().length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-ink-muted shadow-card">
          No matching city in the list — you can still use what you&apos;ve typed.
        </div>
      )}
    </div>
  );
}
