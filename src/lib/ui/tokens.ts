/**
 * Invexio design tokens — shared constants for TS logic and documentation.
 * Visual values are mirrored in tailwind.config.ts and globals.css.
 */

export const spacing = {
  pageX: "1rem",
  pageXMd: "1.5rem",
  pageY: "1rem",
  pageYMd: "1.5rem",
  card: "1.5rem",
  cardSm: "1rem",
  section: "1.5rem",
  sidebar: "1rem"
} as const;

export const radius = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "9999px"
} as const;

export const typography = {
  display: "text-2xl font-semibold tracking-tight text-foreground",
  title: "text-xl font-semibold text-foreground",
  subtitle: "text-sm text-muted-foreground",
  body: "text-sm text-foreground",
  caption: "text-xs text-muted-foreground",
  label: "text-sm font-medium text-foreground"
} as const;

/** Stock thresholds aligned with product filters (queries). */
export const stockThresholds = {
  lowStockMax: 10,
  inStockMin: 11
} as const;

export type StockLevel = "in_stock" | "low_stock" | "out_of_stock";

export function getStockLevel(quantity: number): StockLevel {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= stockThresholds.lowStockMax) return "low_stock";
  return "in_stock";
}
