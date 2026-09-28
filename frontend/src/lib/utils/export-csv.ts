/**
 * Client-side CSV export — no library dependency (this sandbox has no npm
 * registry access to install/verify one; see docs/OPEN_QUESTIONS.md #77).
 * A `.csv` file opens directly in Excel/Google Sheets/Numbers with no
 * import step, so this satisfies "excel sheet ... download option" without
 * needing a real `.xlsx` binary — see that Open Question entry for the
 * exact reasoning and the one-line swap point if a real `.xlsx` (e.g. via
 * the `xlsx`/SheetJS package) is ever wanted instead.
 *
 * `rows` is an array of arrays (first row = header). Every cell is coerced
 * to a string, double-quoted, and internal quotes doubled per RFC 4180, so
 * commas/newlines/quotes inside a cell (e.g. a package's comma-separated
 * feature list) can't corrupt the file's column structure.
 */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  // Leading BOM so Excel (Windows in particular) detects UTF-8 and renders
  // the Hindi/₹ text correctly instead of guessing a legacy code page.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
