"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, AlertTriangle, Printer, FileSpreadsheet } from "lucide-react";
import { SectionHeading } from "@/components/marketing/section-heading";
import { DataTable } from "@/components/domain/data-table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { CONSTRUCTION_PACKAGES } from "@/lib/content/public-site";
import { PackageComparisonTable } from "@/components/marketing/sections/package-comparison-table";
import { PackageSpecsAccordion } from "@/components/marketing/sections/package-specs-accordion";
import { useCreateLead } from "@/hooks/use-create-lead";
import { usePrintScope } from "@/hooks/use-print-scope";
import {
  computeAllPackageEstimates,
  derivePlinthAreaFromPlot,
  GROUND_COVERAGE_OPTIONS,
  DEFAULT_GROUND_COVERAGE_PERCENT,
} from "@/components/marketing/sections/cost-estimator-math";
import { formatINR } from "@/lib/utils/format";
import { downloadCsv } from "@/lib/utils/export-csv";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/components/providers/language-provider";
import { localize, PACKAGE_HI, FLOOR_OPTION_LABEL_HI, TIMELINE_OPTION_HI } from "@/lib/i18n/translations";

const FLOOR_OPTIONS = [
  { value: 1, label: "Ground Floor Only (G)" },
  { value: 2, label: "G + 1 Floor" },
  { value: 3, label: "G + 2 Floors" },
  { value: 4, label: "G + 3 Floors" },
  { value: 5, label: "G + 4 Floors" },
] as const;

const TIMELINE_OPTIONS = ["0–3 months", "3–6 months", "More than 6 months", "Not sure yet"] as const;

type EstimatorMode = "plot" | "builtup";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LeadFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  consent?: string;
}

/**
 * Interactive build-cost calculator — v2 (this pass). Originally built as
 * "just like JSW One Homes' cost estimator, but in a better way" (see
 * docs/OPEN_QUESTIONS.md #59). Owner then asked, against a screenshot of
 * JSW's own tool, for "exactly more features what JSW homes are providing
 * ... something extraordinary." This pass audited jswonehomes.com/cost-
 * estimator directly and matched every real input field it offers, while
 * deliberately keeping the three improvements already documented for v1
 * (live calculation with no contact-info gate; all 4 real package tiers
 * shown openly; a full, plain-language "how this is calculated" panel) —
 * see docs/OPEN_QUESTIONS.md #63 for the complete feature-by-feature
 * mapping and every frontend decision made building this.
 *
 * WHAT'S NEW IN v2, matched from JSW's own tool:
 * - Two input modes, exactly mirroring JSW's own two tabs: "I have basic
 *   details" (you only know your Plot Area — the calculator derives a
 *   Plinth Area from an adjustable, clearly-labeled ground-coverage
 *   assumption, see `derivePlinthAreaFromPlot`) and "I have all details"
 *   (you type your exact Plinth/Built-up area directly — this is the
 *   entire v1 flow, unchanged).
 * - Construction start timeframe and a project location field (JSW's City
 *   dropdown — built here as free text instead, since BrickBasket has one
 *   confirmed office/service address, not a confirmed multi-city list; see
 *   docs/OPEN_QUESTIONS.md #63).
 * - An optional "get this estimate followed up by our team" panel (Full
 *   Name / Mobile / Email + a consent checkbox, JSW's own gated fields) —
 *   kept *after* the live estimate rather than before it, so seeing a
 *   number is never gated behind contact details. Submits through the same
 *   `useCreateLead` → `leadsAdapter` path as the public Contact form.
 *
 * WHAT'S NEW BEYOND JSW (this pass's own additions, not a copy of
 * anything JSW shows — its results screen isn't publicly inspectable, see
 * docs/OPEN_QUESTIONS.md #63):
 * - A side-by-side "compare all 4 packages for this size" table.
 * - A "Package specifications" accordion (`PackageSpecsAccordion`), built
 *   directly against a JSW Packages-page screenshot the owner supplied —
 *   see `docs/OPEN_QUESTIONS.md` #76 for the full build record.
 * - A "What this estimate includes" panel, naming — in general, industry-
 *   standard terms, not fabricated BrickBasket policy — the kinds of costs
 *   a per-sqft estimate anywhere typically excludes (land cost, approvals,
 *   soil testing, utility connections), with a prompt to confirm exact
 *   inclusions for the chosen package with BrickBasket directly.
 *
 * **BOQ VISIBILITY (owner correction, prior pass)**: this component used to
 * also render the full, itemized 11-line Bill of Quantities — quantities,
 * per-unit ₹ rates, a Structure-vs-Finish cost-split bar, and a line-by-line
 * "how these estimates are calculated" breakdown — right here, visible to
 * any site visitor. The owner asked directly for the BOQ to stop being
 * visible to visitors, restricted to "only the core BrickBasket team." That
 * entire block (and its `useBoqRates()`/`computeBoqRows()` data fetch) was
 * removed from this public component; the real, admin-editable BOQ rate
 * card is untouched and still lives entirely behind `/admin/pricing-content`
 * (`pricing_content:view`/`pricing_content:manage` permissions — already
 * internal-only, nothing new needed there). See `docs/OPEN_QUESTIONS.md`
 * #76 for the full reasoning and what stayed (the aggregate "Estimated
 * Project Cost" figure, which reveals only the same published ₹/sqft rate
 * already shown on `/plans`, not any per-material rate).
 *
 * **PRINT / EXCEL FIX (this pass, owner correction)**: "Save / Print This
 * Estimate" used to call bare `window.print()`, which prints whatever page
 * it's invoked from top to bottom — since this section lives on the Home
 * one-pager, that meant the entire site (header, every other section,
 * footer — 18 pages in the owner's own screenshot), not the estimate. Fixed
 * with `usePrintScope()` (`src/hooks/use-print-scope.ts`): the button now
 * prints ONLY a dedicated, always-in-DOM-but-screen-hidden summary card
 * (`printRef` below, `.print-scope-summary` in `src/app/globals.css`) built
 * specifically for print — package, area, cost, key inputs and inclusions —
 * never the page around it. A second new button, "Download as Excel",
 * exports the same estimate (plus the full package-comparison breakdown) as
 * a `.csv` file via `downloadCsv()` (`src/lib/utils/export-csv.ts`) — this
 * sandbox has no npm registry access to install/verify a real `.xlsx`
 * library, and `.csv` opens directly in Excel/Sheets/Numbers with no import
 * step, so it satisfies "excel sheet ... download option" without that
 * dependency; see docs/OPEN_QUESTIONS.md #77 for the full reasoning.
 *
 * **HINDI (this pass, owner correction: "an additional hindi language...
 * for the regional visitors/customers")**: every static label, hint, button
 * and heading in this component reads through `useLanguage()`'s `t()`, and
 * content-array-driven pieces (package `newAtThisTier` bullets, floor/
 * timeline option labels) through the `*_HI` lookup maps in
 * `src/lib/i18n/translations.ts`. A handful of sentences interpolate a
 * runtime value (the selected package's name, computed areas) into the
 * middle of a sentence — those are written as inline bilingual template
 * strings right where they're used below (flagged with a comment at each
 * one) rather than forced through the dotted `t()` lookup, since Hindi's
 * SOV word order doesn't always place the inserted value at the same point
 * in the sentence as English does; each is a best-effort translation, not
 * machine-generated, but worth an owner/native-speaker read-through like
 * every other Hindi string in this pass. The CSV export and printable
 * summary are bilingual the same way. The Package Specs Accordion's
 * detailed per-tier bullets stay English-only — see the i18n file header.
 *
 * See `cost-estimator-math.ts` for every calculation this section renders,
 * and its module doc comment for exactly what's owner-confirmed (the real
 * per-sqft package rates) versus this frontend's own, clearly-labeled
 * construction-estimation model (everything the total is broken into) — the
 * BOQ math there is unchanged and still used by `/admin/pricing-content`.
 */
export function CostEstimatorSection({
  id,
  className,
  showHeading,
}: {
  id?: string;
  className?: string;
  showHeading?: boolean;
}) {
  const { lang, t } = useLanguage();
  const { printElement } = usePrintScope();
  const printRef = useRef<HTMLDivElement>(null);

  const plotAreaId = useId();
  const groundCoverageId = useId();
  const plinthAreaId = useId();
  const floorsId = useId();
  const timelineId = useId();
  const locationId = useId();
  const leadNameId = useId();
  const leadEmailId = useId();
  const leadPhoneId = useId();

  const [mode, setMode] = useState<EstimatorMode>("plot");
  const [plotAreaInput, setPlotAreaInput] = useState("");
  const [groundCoverage, setGroundCoverage] = useState<number>(DEFAULT_GROUND_COVERAGE_PERCENT);
  const [plinthAreaInput, setPlinthAreaInput] = useState("");
  const [floors, setFloors] = useState<number>(2);
  const [packageSlug, setPackageSlug] = useState<string>("smart");
  const [ownsLand, setOwnsLand] = useState<boolean | null>(null);
  const [timeline, setTimeline] = useState("");
  const [location, setLocation] = useState("");

  // Optional "have our team follow up" mini lead-capture — see module doc.
  const { submit: submitLead, status: leadStatus, error: leadError, reset: resetLead } = useCreateLead();
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [leadFormErrors, setLeadFormErrors] = useState<LeadFormErrors>({});

  const plotArea = Number(plotAreaInput);
  const hasValidPlotArea = plotAreaInput.trim() !== "" && Number.isFinite(plotArea) && plotArea > 0;
  const derivedPlinthFromPlot = hasValidPlotArea ? derivePlinthAreaFromPlot(plotArea, groundCoverage) : 0;

  const plinthAreaManual = Number(plinthAreaInput);
  const hasValidPlinthManual = plinthAreaInput.trim() !== "" && Number.isFinite(plinthAreaManual) && plinthAreaManual > 0;

  const effectivePlinthArea = mode === "plot" ? derivedPlinthFromPlot : plinthAreaManual;
  const hasValidArea = mode === "plot" ? hasValidPlotArea : hasValidPlinthManual;

  const selectedPackage = CONSTRUCTION_PACKAGES.find((pkg) => pkg.slug === packageSlug);
  const floorOption = FLOOR_OPTIONS.find((option) => option.value === floors);
  const floorLabelDisplay = floorOption ? localize(lang, floorOption.label, FLOOR_OPTION_LABEL_HI) : "";

  const estimate = useMemo(() => {
    if (!hasValidArea || !selectedPackage || effectivePlinthArea <= 0) return null;
    const builtUpArea = effectivePlinthArea * floors;
    return {
      builtUpArea,
      low: builtUpArea * selectedPackage.rateMin,
      high: builtUpArea * selectedPackage.rateMax,
    };
  }, [hasValidArea, effectivePlinthArea, floors, selectedPackage]);

  const allPackageEstimates = useMemo(
    () => (estimate ? computeAllPackageEstimates(estimate.builtUpArea, CONSTRUCTION_PACKAGES) : []),
    [estimate],
  );

  const costLabel =
    estimate && (estimate.low === estimate.high ? formatINR(estimate.low) : `${formatINR(estimate.low)} – ${formatINR(estimate.high)}`);

  function handleLeadSubmit(e: FormEvent) {
    e.preventDefault();
    const errors: LeadFormErrors = {};
    if (leadName.trim().length < 2) errors.name = t("costEstimator.errName");
    if (!EMAIL_RE.test(leadEmail.trim())) errors.email = t("costEstimator.errEmail");
    if (leadPhone.trim().length < 8) errors.phone = t("costEstimator.errPhone");
    if (!consentChecked) errors.consent = t("costEstimator.errConsent");
    setLeadFormErrors(errors);
    if (Object.keys(errors).length > 0 || !estimate || !selectedPackage) return;

    // Internal CRM message stays in English regardless of the visitor's
    // chosen display language — this text is read by BrickBasket staff in
    // the admin Leads module, which (like the rest of internal tooling) is
    // English-only by this codebase's existing convention, not shown back
    // to the visitor.
    const rangeText =
      estimate.low === estimate.high
        ? formatINR(estimate.low)
        : `${formatINR(estimate.low)} – ${formatINR(estimate.high)}`;
    const messageLines = [
      `Cost Estimator enquiry — ${selectedPackage.name} package.`,
      `Built-up area: ${estimate.builtUpArea.toLocaleString("en-IN")} sqft` +
        (mode === "plot"
          ? ` (derived from ${plotArea.toLocaleString("en-IN")} sqft plot at ${groundCoverage}% assumed ground coverage × ${floorOption?.label ?? floors}).`
          : ` (${effectivePlinthArea.toLocaleString("en-IN")} sqft plinth × ${floorOption?.label ?? floors}).`),
      `Estimated cost: ${rangeText}.`,
      ownsLand !== null ? `Owns plot of land: ${ownsLand ? "Yes" : "No"}.` : null,
      location.trim() ? `Project location: ${location.trim()}.` : null,
      timeline ? `Wants to start construction in: ${timeline}.` : null,
    ].filter(Boolean);

    submitLead({
      name: leadName.trim(),
      email: leadEmail.trim(),
      phone: leadPhone.trim(),
      subject: `Cost Estimate Enquiry — ${selectedPackage.name} Package`,
      message: messageLines.join("\n"),
      source: "website",
    }).then((created) => {
      if (created) {
        setLeadName("");
        setLeadEmail("");
        setLeadPhone("");
        setConsentChecked(false);
      }
    });
  }

  function handleDownloadExcel() {
    if (!estimate || !selectedPackage) return;

    const rateLabel = (pkg: { rateMin: number; rateMax: number }) =>
      pkg.rateMin === pkg.rateMax
        ? `₹${pkg.rateMin.toLocaleString("en-IN")}`
        : `₹${pkg.rateMin.toLocaleString("en-IN")}–₹${pkg.rateMax.toLocaleString("en-IN")}`;

    const rows: (string | number)[][] = [
      [t("costEstimator.csvHeading")],
      [t("costEstimator.csvGeneratedOn"), new Date().toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN")],
      [],
      [t("costEstimator.csvPackage"), selectedPackage.name],
      [t("costEstimator.csvRate"), rateLabel(selectedPackage)],
      [t("costEstimator.csvBuiltUpArea"), estimate.builtUpArea],
      [t("costEstimator.csvFloors"), floorLabelDisplay || floors],
      [t("costEstimator.csvOwnsLand"), ownsLand === null ? "" : ownsLand ? t("costEstimator.yes") : t("costEstimator.no")],
      [t("costEstimator.csvTimeline"), timeline ? localize(lang, timeline, TIMELINE_OPTION_HI) : ""],
      [t("costEstimator.csvLocation"), location || ""],
      [t("costEstimator.csvEstimatedCost"), costLabel || ""],
      [],
      [t("costEstimator.csvComparisonHeading")],
      [t("packageComparisonTable.colPackage"), t("packageComparisonTable.colRate"), t("costEstimator.csvEstimatedCost")],
      ...allPackageEstimates.map((pkg) => {
        const source = CONSTRUCTION_PACKAGES.find((p) => p.slug === pkg.slug);
        const rate = source ? rateLabel(source) : "";
        const cost = pkg.low === pkg.high ? formatINR(pkg.low) : `${formatINR(pkg.low)} – ${formatINR(pkg.high)}`;
        return [pkg.name, rate, cost];
      }),
      [],
      [t("costEstimator.csvDisclaimer")],
    ];

    downloadCsv(`BrickBasket-Estimate-${selectedPackage.slug}`, rows);
  }

  return (
    <section id={id} className={cn("container py-16 md:py-20", className)}>
      {showHeading && <SectionHeading eyebrow={t("costEstimator.headingEyebrow")} title={t("costEstimator.headingTitle")} />}

      <fieldset className="mt-10">
        <legend className="text-sm font-semibold text-ink">{t("costEstimator.step1Legend")}</legend>
        <div role="radiogroup" aria-label={t("costEstimator.step1Legend")} className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONSTRUCTION_PACKAGES.map((pkg) => {
            const selected = pkg.slug === packageSlug;
            const newAtThisTier = lang === "hi" ? (PACKAGE_HI[pkg.slug]?.newAtThisTier ?? pkg.newAtThisTier) : pkg.newAtThisTier;
            return (
              <label
                key={pkg.slug}
                className={cn(
                  "flex cursor-pointer flex-col rounded-card border p-4 transition-colors",
                  selected
                    ? "border-brand-red bg-brand-red/5 ring-2 ring-brand-red"
                    : "border-border bg-surface hover:border-brand-red/40",
                )}
              >
                <input
                  type="radio"
                  name="package"
                  value={pkg.slug}
                  checked={selected}
                  onChange={() => setPackageSlug(pkg.slug)}
                  className="sr-only"
                />
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-red">{pkg.name}</span>
                <span className="mt-1 font-heading text-lg font-bold text-ink">
                  ₹{pkg.rateMin.toLocaleString("en-IN")}
                  {pkg.rateMax !== pkg.rateMin && `–₹${pkg.rateMax.toLocaleString("en-IN")}`}
                  <span className="text-xs font-normal text-ink-muted"> /sqft</span>
                </span>
                <ul className="mt-2 flex flex-col gap-1 text-xs text-ink-muted">
                  {newAtThisTier.map((item, i) => (
                    <li key={`${pkg.slug}-${i}`} className="flex gap-1.5">
                      <span aria-hidden>•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </label>
            );
          })}
        </div>
        <div className="mt-6">
          <PackageComparisonTable selectedSlug={packageSlug} />
        </div>
        <div className="mt-6">
          <PackageSpecsAccordion selectedSlug={packageSlug} />
        </div>
      </fieldset>

      <div className="mt-10">
        <span className="text-sm font-semibold text-ink">{t("costEstimator.step2Legend")}</span>

        <div className="mt-3 inline-flex rounded-md border border-border p-0.5">
          <Button
            type="button"
            variant={mode === "plot" ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={mode === "plot"}
            onClick={() => setMode("plot")}
          >
            {t("costEstimator.modeBasic")}
          </Button>
          <Button
            type="button"
            variant={mode === "builtup" ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={mode === "builtup"}
            onClick={() => setMode("builtup")}
          >
            {t("costEstimator.modeAll")}
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-ink-muted">
          {mode === "plot" ? t("costEstimator.modeBasicHint") : t("costEstimator.modeAllHint")}
        </p>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            {mode === "plot" ? (
              <>
                <FormField
                  label={t("costEstimator.plotAreaLabel")}
                  htmlFor={plotAreaId}
                  hint={t("costEstimator.plotAreaHint")}
                >
                  <Input
                    id={plotAreaId}
                    type="number"
                    min={1}
                    inputMode="decimal"
                    placeholder="e.g. 2000"
                    value={plotAreaInput}
                    onChange={(e) => setPlotAreaInput(e.target.value)}
                  />
                </FormField>
                <FormField
                  label={t("costEstimator.groundCoverageLabel")}
                  htmlFor={groundCoverageId}
                  hint={t("costEstimator.groundCoverageHint")}
                >
                  <Select
                    id={groundCoverageId}
                    value={groundCoverage}
                    onChange={(e) => setGroundCoverage(Number(e.target.value))}
                  >
                    {GROUND_COVERAGE_OPTIONS.map((pct) => (
                      <option key={pct} value={pct}>
                        {pct}%{pct === DEFAULT_GROUND_COVERAGE_PERCENT ? ` ${t("costEstimator.typicalDefault")}` : ""}
                      </option>
                    ))}
                  </Select>
                </FormField>
                {hasValidPlotArea && (
                  <p className="text-xs text-ink-muted">
                    → {t("costEstimator.derivedPlinthAreaLabel")}:{" "}
                    <span className="font-medium text-ink">{derivedPlinthFromPlot.toLocaleString("en-IN")} sqft</span>{" "}
                    ({plotArea.toLocaleString("en-IN")} sqft × {groundCoverage}%). {t("costEstimator.knowExactPlinthArea")}{" "}
                    <button type="button" onClick={() => setMode("builtup")} className="text-brand-red hover:underline">
                      {t("costEstimator.switchToAllDetails")}
                    </button>
                    .
                  </p>
                )}
              </>
            ) : (
              <FormField
                label={t("costEstimator.plinthAreaLabel")}
                htmlFor={plinthAreaId}
                hint={t("costEstimator.plinthAreaHint")}
              >
                <Input
                  id={plinthAreaId}
                  type="number"
                  min={1}
                  inputMode="decimal"
                  placeholder="e.g. 1200"
                  value={plinthAreaInput}
                  onChange={(e) => setPlinthAreaInput(e.target.value)}
                />
              </FormField>
            )}

            <FormField label={t("costEstimator.floorsLabel")} htmlFor={floorsId}>
              <Select id={floorsId} value={floors} onChange={(e) => setFloors(Number(e.target.value))}>
                {FLOOR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {localize(lang, option.label, FLOOR_OPTION_LABEL_HI)}
                  </option>
                ))}
              </Select>
            </FormField>

            <fieldset>
              <legend className="text-sm font-medium text-ink">{t("costEstimator.ownsLandLegend")}</legend>
              <div className="mt-2 flex gap-4 text-sm text-ink">
                <label className="flex items-center gap-2">
                  <input type="radio" name="owns-land" checked={ownsLand === true} onChange={() => setOwnsLand(true)} />
                  {t("costEstimator.yes")}
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="owns-land" checked={ownsLand === false} onChange={() => setOwnsLand(false)} />
                  {t("costEstimator.no")}
                </label>
              </div>
              {ownsLand === false && (
                <p className="mt-2 text-xs text-ink-muted">
                  {t("costEstimator.noLandNotePre")}{" "}
                  <Link href="/#services" className="text-brand-red hover:underline">
                    {t("costEstimator.landPurchaseLink")}
                  </Link>{" "}
                  {t("costEstimator.noLandNotePost")}
                </p>
              )}
            </fieldset>
          </div>

          <Card className="flex flex-col justify-center p-6 md:p-8">
            {estimate && selectedPackage && floorOption ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {t("costEstimator.estimatedCostLabel")} — {selectedPackage.name}
                </p>
                <p className="mt-2 font-heading text-2xl font-bold text-brand-red md:text-3xl">{costLabel}</p>
                {/* Interpolated sentence — see module doc "HINDI" note on why this is an inline bilingual template rather than a dotted t() key. */}
                <p className="mt-1 text-sm text-ink-muted">
                  {lang === "hi"
                    ? `कुल ${estimate.builtUpArea.toLocaleString("en-IN")} वर्ग फुट बिल्ट-अप क्षेत्रफल के लिए (${effectivePlinthArea.toLocaleString("en-IN")} वर्ग फुट × ${floorLabelDisplay})`
                    : `for ${estimate.builtUpArea.toLocaleString("en-IN")} sqft total built-up area (${effectivePlinthArea.toLocaleString("en-IN")} sqft × ${floorOption.label})`}
                </p>
                <p className="mt-4 text-xs text-ink-muted">
                  {lang === "hi"
                    ? `केवल सांकेतिक, हमारी प्रकाशित ${selectedPackage.name} दर के आधार पर। आपकी अंतिम कोटेशन साइट की स्थितियों, डिज़ाइन विकल्पों और सामग्री चयन पर निर्भर करती है।`
                    : `Indicative only, based on our published ${selectedPackage.name} rate. Your final quote depends on site conditions, design choices and material selections.`}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/#contact" className={cn(buttonVariants({ size: "md" }))}>
                    {t("costEstimator.getDetailedQuote")}
                  </Link>
                  <Button type="button" variant="outline" size="md" onClick={() => printElement(printRef)}>
                    <Printer className="h-4 w-4" aria-hidden />
                    {t("costEstimator.savePrint")}
                  </Button>
                  <Button type="button" variant="outline" size="md" onClick={handleDownloadExcel}>
                    <FileSpreadsheet className="h-4 w-4" aria-hidden />
                    {t("costEstimator.downloadExcel")}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-ink-muted">
                {mode === "plot" ? t("costEstimator.enterPlotAreaPrompt") : t("costEstimator.enterPlinthAreaPrompt")}
              </p>
            )}
          </Card>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <FormField
            label={t("costEstimator.timelineLabel")}
            htmlFor={timelineId}
            hint={t("costEstimator.timelineHint")}
          >
            <Select id={timelineId} value={timeline} onChange={(e) => setTimeline(e.target.value)}>
              <option value="">{t("costEstimator.preferNotToSay")}</option>
              {TIMELINE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {localize(lang, option, TIMELINE_OPTION_HI)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            label={t("costEstimator.locationLabel")}
            htmlFor={locationId}
            hint={t("costEstimator.locationHint")}
          >
            <Input
              id={locationId}
              placeholder={t("costEstimator.locationPlaceholder")}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </FormField>
        </div>
      </div>

      {estimate && allPackageEstimates.length > 0 && (
        <div className="mt-10">
          <h3 className="font-heading text-lg font-semibold text-ink">{t("costEstimator.compareHeading")}</h3>
          {/* Interpolated sentence — see module doc "HINDI" note. */}
          <p className="mt-1 text-sm text-ink-muted">
            {lang === "hi"
              ? `वही ${estimate.builtUpArea.toLocaleString("en-IN")} वर्ग फुट, हमारे द्वारा दिए जाने वाले हर पैकेज में मूल्य निर्धारित — ताकि निर्णय लेने से पहले आप देख सकें कि आपका चयन कहां खड़ा है।`
              : `The same ${estimate.builtUpArea.toLocaleString("en-IN")} sqft, priced across every package we offer — so you can see where your selection sits before deciding.`}
          </p>
          <div className="mt-4">
            <DataTable
              columns={[
                {
                  key: "name",
                  header: t("packageComparisonTable.colPackage"),
                  render: (pkg) => (
                    <span className="flex items-center gap-2 font-medium text-ink">
                      {pkg.name}
                      {pkg.slug === packageSlug && <Badge variant="brand">{t("packageComparisonTable.selectedBadge")}</Badge>}
                    </span>
                  ),
                },
                {
                  key: "cost",
                  header: t("costEstimator.estimatedCost"),
                  className: "text-right",
                  render: (pkg) => (pkg.low === pkg.high ? formatINR(pkg.low) : `${formatINR(pkg.low)} – ${formatINR(pkg.high)}`),
                },
              ]}
              rows={allPackageEstimates}
              keyFor={(pkg) => pkg.slug}
              onRowClick={(pkg) => setPackageSlug(pkg.slug)}
            />
          </div>
        </div>
      )}

      {estimate && selectedPackage && (
        <div className="mt-10">
          <div className="rounded-card border border-border bg-surface-muted p-4 md:p-6">
            <h4 className="font-heading text-base font-semibold text-ink">{t("costEstimator.includesHeading")}</h4>
            {/* Interpolated sentence — see module doc "HINDI" note. */}
            <p className="mt-2 text-sm text-ink-muted">
              {lang === "hi" ? (
                <>
                  शामिल है: ऊपर दी गई पूर्ण निर्माण लागत (सामग्री + श्रम, आपके चयनित पैकेज की दर के अनुसार) और {selectedPackage.name} के लिए सूचीबद्ध
                  प्रक्रिया/सेवा सुविधाएं, हमारे{" "}
                  <Link href="/plans" className="text-brand-red hover:underline">
                    प्लान्स पेज
                  </Link>{" "}
                  पर।
                </>
              ) : (
                <>
                  Included: the full construction cost above (materials + labor, per your selected package&apos;s rate)
                  and the process/service features listed for {selectedPackage.name} on our{" "}
                  <Link href="/plans" className="text-brand-red hover:underline">
                    Plans page
                  </Link>
                  .
                </>
              )}
            </p>
            {/* Interpolated sentence — see module doc "HINDI" note. */}
            <p className="mt-2 text-sm text-ink-muted">
              {lang === "hi" ? (
                <>
                  आमतौर पर यह किसी भी प्रति-वर्ग-फुट निर्माण अनुमान का हिस्सा <span className="font-medium text-ink">नहीं</span> होता — उद्योग में
                  कहीं भी, केवल इस आंकड़े तक सीमित नहीं — और बजट अंतिम करने से पहले हमारी टीम से पुष्टि करना उचित है: ज़मीन की लागत, सरकारी
                  अनुमोदन एवं प्लान-सैंक्शन शुल्क, मिट्टी परीक्षण, और यूटिलिटी (पानी/बिजली) कनेक्शन शुल्क।
                  {selectedPackage.slug === "signature"
                    ? " Signature एकमात्र ऐसा पैकेज है जिसमें पहले से ही वास्तुशिल्प डिज़ाइन और प्लॉट-खोज सहायता शामिल है — इसकी मुख्य विशेषताएं देखें।"
                    : " हमसे पूछें कि क्या वास्तुशिल्प डिज़ाइन शुल्क आपके चयनित पैकेज में शामिल है या अलग से लिया जाता है।"}
                </>
              ) : (
                <>
                  Typically <span className="font-medium text-ink">not</span> part of any per-sqft construction estimate
                  — anywhere in the industry, not specific to this figure — and worth confirming with our team before
                  you finalize a budget: the cost of the land itself, government approvals and plan-sanction fees, soil
                  testing, and utility (water/power) connection charges.
                  {selectedPackage.slug === "signature"
                    ? " Signature is the one package that already bundles architectural design and plot-finding assistance — see its Core Features."
                    : " Ask us whether architectural design fees are bundled into your selected package or billed separately."}
                </>
              )}
            </p>
          </div>

          <p className="mt-3 text-xs text-ink-muted">{t("costEstimator.disclaimerFooter")}</p>
        </div>
      )}

      {estimate && selectedPackage && (
        <div className="mt-10 rounded-card border border-border bg-surface p-6 md:p-8">
          {leadStatus === "success" ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
              <h3 className="font-heading text-lg font-semibold text-ink">{t("costEstimator.thanksTitle")}</h3>
              {/* Interpolated sentence — see module doc "HINDI" note. */}
              <p className="text-sm text-ink-muted">
                {lang === "hi"
                  ? `हमारी टीम इस ${selectedPackage.name} अनुमान की समीक्षा करेगी और एक विस्तृत, साइट-विशिष्ट कोटेशन के साथ फॉलो-अप करेगी।`
                  : `Our team will review this ${selectedPackage.name} estimate and follow up with a detailed, site-specific quote.`}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={resetLead}>
                {t("costEstimator.sendAnotherEnquiry")}
              </Button>
            </div>
          ) : (
            <>
              <h3 className="font-heading text-lg font-semibold text-ink">{t("costEstimator.followUpHeading")}</h3>
              {/* Interpolated sentence — see module doc "HINDI" note. */}
              <p className="mt-1 text-sm text-ink-muted">
                {lang === "hi"
                  ? `वैकल्पिक — आपको ऊपर पहले ही अपना अनुमान मिल चुका है। अपनी जानकारी साझा करें और हम आपके ${selectedPackage.name} पैकेज के लिए एक विस्तृत, साइट-विशिष्ट कोटेशन के साथ फॉलो-अप करेंगे।`
                  : `Optional — you've already got your estimate above. Share your details and we'll follow up with a detailed, site-specific quote for your ${selectedPackage.name} package.`}
              </p>
              <form onSubmit={handleLeadSubmit} className="mt-5 flex flex-col gap-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField label={t("costEstimator.fullName")} htmlFor={leadNameId} required error={leadFormErrors.name}>
                    <Input
                      id={leadNameId}
                      value={leadName}
                      invalid={!!leadFormErrors.name}
                      onChange={(e) => setLeadName(e.target.value)}
                    />
                  </FormField>
                  <FormField label={t("costEstimator.mobileNumber")} htmlFor={leadPhoneId} required error={leadFormErrors.phone}>
                    <Input
                      id={leadPhoneId}
                      type="tel"
                      value={leadPhone}
                      invalid={!!leadFormErrors.phone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                    />
                  </FormField>
                  <FormField label={t("costEstimator.emailAddress")} htmlFor={leadEmailId} required error={leadFormErrors.email}>
                    <Input
                      id={leadEmailId}
                      type="email"
                      value={leadEmail}
                      invalid={!!leadFormErrors.email}
                      onChange={(e) => setLeadEmail(e.target.value)}
                    />
                  </FormField>
                </div>

                <label className="flex items-start gap-2 text-sm text-ink">
                  <Checkbox
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    aria-invalid={!!leadFormErrors.consent}
                  />
                  <span>{t("costEstimator.consentText")}</span>
                </label>
                {leadFormErrors.consent && (
                  <p className="-mt-2 text-xs font-medium text-error">{leadFormErrors.consent}</p>
                )}

                {leadStatus === "error" && (
                  <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                    {leadError}
                  </div>
                )}

                <Button type="submit" size="md" disabled={leadStatus === "loading"} className="self-start">
                  {leadStatus === "loading" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  {t("costEstimator.sendEstimate")}
                </Button>
              </form>
            </>
          )}
        </div>
      )}

      {/*
       * PRINT-ONLY summary card — see module doc "PRINT / EXCEL FIX". Always
       * in the DOM so `printRef` has a stable target, but `.print-scope-summary`
       * (src/app/globals.css) keeps it `display: none` on screen at all times;
       * it's only ever revealed for the moment `printElement(printRef)`
       * triggers a scoped print, never for an ordinary Ctrl+P elsewhere.
       * Deliberately plain, high-contrast, print-friendly markup — no cards,
       * shadows or interactive controls, since none of that is meant to be
       * read on paper.
       */}
      <div ref={printRef} className="print-scope-summary p-8 text-black">
        <h1 className="text-2xl font-bold">{t("costEstimator.csvHeading")}</h1>
        <p className="mt-1 text-sm text-gray-600">
          {t("costEstimator.printedOn")}: {new Date().toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN")}
        </p>

        {estimate && selectedPackage && (
          <>
            <table className="mt-6 w-full border-collapse text-sm">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="py-2 pr-4 font-semibold">{t("costEstimator.csvPackage")}</td>
                  <td className="py-2">{selectedPackage.name}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 pr-4 font-semibold">{t("costEstimator.csvRate")}</td>
                  <td className="py-2">
                    ₹{selectedPackage.rateMin.toLocaleString("en-IN")}
                    {selectedPackage.rateMax !== selectedPackage.rateMin && `–₹${selectedPackage.rateMax.toLocaleString("en-IN")}`}
                    /sqft
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 pr-4 font-semibold">{t("costEstimator.csvBuiltUpArea")}</td>
                  <td className="py-2">{estimate.builtUpArea.toLocaleString("en-IN")} sqft</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 pr-4 font-semibold">{t("costEstimator.csvFloors")}</td>
                  <td className="py-2">{floorLabelDisplay}</td>
                </tr>
                {ownsLand !== null && (
                  <tr className="border-b border-gray-300">
                    <td className="py-2 pr-4 font-semibold">{t("costEstimator.csvOwnsLand")}</td>
                    <td className="py-2">{ownsLand ? t("costEstimator.yes") : t("costEstimator.no")}</td>
                  </tr>
                )}
                {timeline && (
                  <tr className="border-b border-gray-300">
                    <td className="py-2 pr-4 font-semibold">{t("costEstimator.csvTimeline")}</td>
                    <td className="py-2">{localize(lang, timeline, TIMELINE_OPTION_HI)}</td>
                  </tr>
                )}
                {location.trim() && (
                  <tr className="border-b border-gray-300">
                    <td className="py-2 pr-4 font-semibold">{t("costEstimator.csvLocation")}</td>
                    <td className="py-2">{location.trim()}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-2 pr-4 text-base font-bold">{t("costEstimator.csvEstimatedCost")}</td>
                  <td className="py-2 text-base font-bold">{costLabel}</td>
                </tr>
              </tbody>
            </table>

            <h2 className="mt-8 text-base font-bold">{t("costEstimator.csvComparisonHeading")}</h2>
            <table className="mt-2 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-gray-400 text-left">
                  <th className="py-1.5 pr-4">{t("packageComparisonTable.colPackage")}</th>
                  <th className="py-1.5 pr-4">{t("packageComparisonTable.colRate")}</th>
                  <th className="py-1.5">{t("costEstimator.csvEstimatedCost")}</th>
                </tr>
              </thead>
              <tbody>
                {allPackageEstimates.map((pkg) => {
                  const source = CONSTRUCTION_PACKAGES.find((p) => p.slug === pkg.slug);
                  return (
                    <tr key={pkg.slug} className="border-b border-gray-200">
                      <td className="py-1.5 pr-4">
                        {pkg.name}
                        {pkg.slug === packageSlug ? ` (${t("packageComparisonTable.selectedBadge")})` : ""}
                      </td>
                      <td className="py-1.5 pr-4">
                        {source &&
                          (source.rateMin === source.rateMax
                            ? `₹${source.rateMin.toLocaleString("en-IN")}`
                            : `₹${source.rateMin.toLocaleString("en-IN")}–₹${source.rateMax.toLocaleString("en-IN")}`)}
                        /sqft
                      </td>
                      <td className="py-1.5">{pkg.low === pkg.high ? formatINR(pkg.low) : `${formatINR(pkg.low)} – ${formatINR(pkg.high)}`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <p className="mt-6 text-xs text-gray-600">{t("costEstimator.csvDisclaimer")}</p>
          </>
        )}
      </div>
    </section>
  );
}
