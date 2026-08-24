/**
 * Browser CSV Export Utility
 * Handles clean UTF-8 CSV formatting with RFC 4180 compliant escaping and Excel BOM support.
 */

export interface CsvColumn {
  key: string;
  label: string;
}

export function exportToCsv(
  filename: string,
  columns: { key: string; label: string }[],
  rows: Record<string, any>[],
) {
  if (typeof window === "undefined") return;

  const escapeCsvCell = (value: any): string => {
    if (value === null || value === undefined) {
      return '""';
    }
    const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);
    const escapedValue = stringValue.replace(/"/g, '""');
    return `"${escapedValue}"`;
  };

  const headerRow = columns.map((col) => escapeCsvCell(col.label)).join(",");
  const dataRows = rows.map((row) => columns.map((col) => escapeCsvCell(row[col.key])).join(","));

  // Prepend UTF-8 BOM so Excel and spreadsheet applications display UTF-8 characters correctly
  const csvContent = "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  const finalFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.setAttribute("download", finalFilename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
