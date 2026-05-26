import Link from "next/link";
import { buildQueryString, type SortDirection } from "@/lib/ui/table-params";
import { TableHead, type TableHeadProps } from "@/components/ui/table";
import { cn } from "@/lib/ui/cn";

type SortableTableHeadProps = TableHeadProps & {
  label: string;
  sortKey: string;
  pathname: string;
  currentSort: string;
  currentDir: SortDirection;
  baseParams: Record<string, string | undefined>;
  align?: "left" | "right";
};

export function SortableTableHead({
  label,
  sortKey,
  pathname,
  currentSort,
  currentDir,
  baseParams,
  align = "left",
  className,
  ...props
}: SortableTableHeadProps) {
  const isActive = currentSort === sortKey;
  const nextDir: SortDirection = isActive && currentDir === "asc" ? "desc" : "asc";
  const href = `${pathname}${buildQueryString(baseParams, { sort: sortKey, dir: nextDir, page: 1 })}`;

  return (
    <TableHead className={cn(align === "right" && "text-right", className)} {...props}>
      <Link
        href={href}
        className={cn(
          "group inline-flex items-center gap-1.5 transition-colors hover:text-foreground",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <span>{label}</span>
        <span className="inline-flex flex-col text-[9px] leading-none opacity-60 group-hover:opacity-100">
          <span className={cn(isActive && currentDir === "asc" && "text-primary")}>▲</span>
          <span className={cn(isActive && currentDir === "desc" && "text-primary")}>▼</span>
        </span>
      </Link>
    </TableHead>
  );
}
