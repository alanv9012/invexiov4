export const DASHBOARD_CHART_DAYS = 7;

type DatedRow = {
  date: string;
};

export type DailyCountPoint = {
  date: string;
  label: string;
  count: number;
};

export type DailyMovementPoint = DailyCountPoint & {
  netChange: number;
};

export type TrendInsight = {
  percentChange: number | null;
  direction: "up" | "down" | "flat";
  label: string;
};

export function formatShortDayLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  return date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

export function buildUtcDayKeys(dayCount: number): string[] {
  const keys: string[] = [];
  const today = new Date();

  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset)
    );
    keys.push(date.toISOString().slice(0, 10));
  }

  return keys;
}

export function toUtcDayKey(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 10);
}

export function buildDailyCountSeries(
  timestamps: string[],
  dayCount = DASHBOARD_CHART_DAYS
): DailyCountPoint[] {
  const keys = buildUtcDayKeys(dayCount);
  const counts = new Map(keys.map((key) => [key, 0]));

  for (const timestamp of timestamps) {
    const key = toUtcDayKey(timestamp);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return keys.map((date) => ({
    date,
    label: formatShortDayLabel(date),
    count: counts.get(date) ?? 0
  }));
}

export function buildDailyMovementSeries(
  rows: Array<{ createdAt: string; changeQuantity: number }>,
  dayCount = DASHBOARD_CHART_DAYS
): DailyMovementPoint[] {
  const keys = buildUtcDayKeys(dayCount);
  const counts = new Map(keys.map((key) => [key, 0]));
  const netChanges = new Map(keys.map((key) => [key, 0]));

  for (const row of rows) {
    const key = toUtcDayKey(row.createdAt);
    if (!counts.has(key)) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    netChanges.set(key, (netChanges.get(key) ?? 0) + row.changeQuantity);
  }

  return keys.map((date) => ({
    date,
    label: formatShortDayLabel(date),
    count: counts.get(date) ?? 0,
    netChange: netChanges.get(date) ?? 0
  }));
}

export function computeTrend(current: number, previous: number, label: string): TrendInsight {
  if (previous === 0 && current === 0) {
    return { percentChange: 0, direction: "flat", label };
  }

  if (previous === 0) {
    return { percentChange: 100, direction: "up", label };
  }

  const percentChange = Math.round(((current - previous) / previous) * 100);
  const direction = percentChange > 0 ? "up" : percentChange < 0 ? "down" : "flat";

  return { percentChange, direction, label };
}

export function splitRecentAndPriorCounts(
  timestamps: string[],
  recentDays: number
): { recent: number; prior: number } {
  const keys = buildUtcDayKeys(recentDays * 2);
  const recentKeys = new Set(keys.slice(recentDays));
  const priorKeys = new Set(keys.slice(0, recentDays));

  let recent = 0;
  let prior = 0;

  for (const timestamp of timestamps) {
    const key = toUtcDayKey(timestamp);
    if (recentKeys.has(key)) recent += 1;
    else if (priorKeys.has(key)) prior += 1;
  }

  return { recent, prior };
}

export function sparklineValues(points: DailyCountPoint[]): number[] {
  return points.map((point) => point.count);
}
