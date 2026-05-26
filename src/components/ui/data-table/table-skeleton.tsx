import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type DataTableSkeletonProps = {
  rows?: number;
  columns?: number;
};

function skeletonWidth(colIndex: number, columns: number): string {
  if (colIndex === 0) return "h-10 w-full max-w-[12rem]";
  if (colIndex === columns - 1) return "ml-auto h-8 w-20";
  return "h-4 w-20";
}

export function DataTableSkeleton({ rows = 8, columns = 6 }: DataTableSkeletonProps) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {Array.from({ length: Math.min(rows, 5) }).map((_, index) => (
          <Card key={index} padding="sm" className="space-y-3">
            <div className="flex gap-3">
              <Skeleton className="h-12 w-12 shrink-0 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </Card>
        ))}
      </div>

      <div className="hidden md:block">
        <TableContainer stickyHeader maxHeight="70vh">
          <Table>
            <TableHeader sticky>
              <TableRow className="hover:bg-transparent">
                {Array.from({ length: columns }).map((_, index) => (
                  <TableHead key={index}>
                    <Skeleton className="h-3 w-16" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Array.from({ length: columns }).map((__, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className={skeletonWidth(colIndex, columns)} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </>
  );
}
