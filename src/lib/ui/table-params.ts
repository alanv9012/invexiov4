import { firstSearchParam } from "@/lib/search-params";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export type SortDirection = "asc" | "desc";

export type TableListParams = {
  page: number;
  pageSize: number;
  sort: string;
  sortDir: SortDirection;
};

export function parsePageParam(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

export function parsePageSizeParam(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? String(DEFAULT_PAGE_SIZE), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(parsed, MAX_PAGE_SIZE);
}

export function parseSortDirParam(value: string | undefined): SortDirection {
  return value === "asc" ? "asc" : "desc";
}

export function parseTableListParams(
  input: Record<string, string | string[] | undefined>,
  defaultSort: string,
  allowedSorts: readonly string[]
): TableListParams {
  const sortCandidate = firstSearchParam(input.sort) ?? defaultSort;
  const sort = allowedSorts.includes(sortCandidate) ? sortCandidate : defaultSort;

  return {
    page: parsePageParam(firstSearchParam(input.page)),
    pageSize: parsePageSizeParam(firstSearchParam(input.pageSize)),
    sort,
    sortDir: parseSortDirParam(firstSearchParam(input.dir))
  };
}

export function toSearchParamsRecord(
  params: Record<string, string | string[] | undefined>
): Record<string, string> {
  const record: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    const normalized = firstSearchParam(value);
    if (normalized) record[key] = normalized;
  }

  return record;
}

export function buildQueryString(
  base: Record<string, string | undefined>,
  overrides: Record<string, string | number | undefined>
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(base)) {
    if (value) params.set(key, value);
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === "") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function getPaginationMeta(page: number, pageSize: number, totalCount: number) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, totalCount);

  return { totalPages, safePage, from, to };
}
