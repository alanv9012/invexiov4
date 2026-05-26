import Link from "next/link";
import { buildQueryString, getPaginationMeta } from "@/lib/ui/table-params";
import { cn } from "@/lib/ui/cn";

type TablePaginationProps = {
  pathname: string;
  page: number;
  pageSize: number;
  totalCount: number;
  baseParams: Record<string, string | undefined>;
};

export function TablePagination({
  pathname,
  page,
  pageSize,
  totalCount,
  baseParams
}: TablePaginationProps) {
  const { totalPages, safePage, from, to } = getPaginationMeta(page, pageSize, totalCount);

  if (totalCount === 0) return null;

  const prevHref =
    safePage > 1
      ? `${pathname}${buildQueryString(baseParams, { page: safePage - 1 })}`
      : undefined;
  const nextHref =
    safePage < totalPages
      ? `${pathname}${buildQueryString(baseParams, { page: safePage + 1 })}`
      : undefined;

  const pageLinks = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((pageNumber) => {
      if (totalPages <= 7) return true;
      return (
        pageNumber === 1 ||
        pageNumber === totalPages ||
        Math.abs(pageNumber - safePage) <= 1
      );
    })
    .reduce<number[]>((acc, pageNumber, index, array) => {
      if (index > 0 && pageNumber - array[index - 1] > 1) {
        acc.push(-1);
      }
      acc.push(pageNumber);
      return acc;
    }, []);

  return (
    <div className="flex flex-col gap-3 border-t border-border bg-surface-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-caption text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> of{" "}
        <span className="font-medium text-foreground">{totalCount}</span>
      </p>

      <nav
        className="flex flex-wrap items-center justify-between gap-2 sm:justify-end sm:gap-1"
        aria-label="Table pagination"
      >
        {prevHref ? (
          <PaginationLink href={prevHref} label="Previous" />
        ) : (
          <PaginationButton disabled>Previous</PaginationButton>
        )}

        <span className="min-w-0 px-1 text-center text-caption text-muted-foreground sm:hidden">
          Page {safePage} of {totalPages}
        </span>

        <div className="hidden items-center gap-1 sm:flex">
          {pageLinks.map((pageNumber, index) =>
            pageNumber === -1 ? (
              <span key={`gap-${index}`} className="px-1 text-muted-foreground">
                …
              </span>
            ) : (
              <PaginationLink
                key={pageNumber}
                href={`${pathname}${buildQueryString(baseParams, { page: pageNumber })}`}
                label={String(pageNumber)}
                isActive={pageNumber === safePage}
              />
            )
          )}
        </div>

        {nextHref ? (
          <PaginationLink href={nextHref} label="Next" />
        ) : (
          <PaginationButton disabled>Next</PaginationButton>
        )}
      </nav>
    </div>
  );
}

function PaginationLink({
  href,
  label,
  isActive = false
}: {
  href: string;
  label: string;
  isActive?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border px-3 py-2 text-caption font-medium transition-colors duration-150 sm:min-h-0 sm:min-w-8 sm:px-2.5 sm:py-1.5",
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-foreground hover:bg-surface-muted"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

function PaginationButton({
  children,
  disabled
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-border px-3 py-2 text-caption font-medium sm:min-h-0 sm:min-w-8 sm:px-2.5 sm:py-1.5",
        disabled && "cursor-not-allowed opacity-50"
      )}
      aria-disabled={disabled}
    >
      {children}
    </span>
  );
}
