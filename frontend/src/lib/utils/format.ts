/**
 * Formats a currency / price amount cleanly without trailing .00 decimals
 * (e.g. "79.00" -> "79", "6590.00" -> "6590", 79.5 -> "79.5").
 */
export function formatPrice(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return "0";
  const num = typeof val === "number" ? val : parseFloat(String(val));
  if (isNaN(num)) return String(val).replace(/\.00$/, "");
  return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, "");
}
