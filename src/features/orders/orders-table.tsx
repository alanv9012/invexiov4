import { formatDateTime, formatMoney } from "@/lib/format";
import type { OrderRow, OrderSortKey, OrderSource } from "@/features/orders/types";
import type { SortDirection } from "@/lib/ui/table-params";
import { OrderStatusBadge, OrderSyncStatusBadge } from "@/components/ui/inventory-badges";
import { Badge } from "@/components/ui/badge";
import { SortableTableHead, TablePagination } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableActionsCell,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

const ORDERS_PATH = "/orders";

const sourceLabels: Record<OrderSource, string> = {
  manual: "Manual",
  woocommerce: "WooCommerce",
  system: "System"
};

type OrdersTableProps = {
  orders: OrderRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  sort: OrderSortKey;
  sortDir: SortDirection;
  baseParams: Record<string, string | undefined>;
};

export function OrdersTable({
  orders,
  totalCount,
  page,
  pageSize,
  sort,
  sortDir,
  baseParams
}: OrdersTableProps) {
  const pagination = (
    <TablePagination
      pathname={ORDERS_PATH}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
      baseParams={{ ...baseParams, sort, dir: sortDir }}
    />
  );

  return (
    <>
      <div className="space-y-3 md:hidden">
        {orders.map((order) => (
          <Card key={order.id} padding="sm" className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-body-sm font-semibold text-foreground">
                  {order.orderNumber ?? order.id.slice(0, 8)}
                </p>
                <p className="mt-0.5 truncate text-body-sm text-muted-foreground">
                  {order.customerName ?? "—"}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <dl className="grid grid-cols-2 gap-2 text-caption">
              <div>
                <dt className="text-muted-foreground">Total</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {formatMoney(order.total, order.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Source</dt>
                <dd>
                  <Badge variant="neutral" size="sm">
                    {sourceLabels[order.source]}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="text-foreground">{formatDateTime(order.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Sync</dt>
                <dd>
                  <OrderSyncStatusBadge status={order.syncStatus} />
                </dd>
              </div>
            </dl>

            <Button
              href={`/orders?q=${encodeURIComponent(order.orderNumber ?? order.id.slice(0, 8))}`}
              variant="secondary"
              className="w-full"
            >
              View order
            </Button>
          </Card>
        ))}

        {totalCount > 0 ? (
          <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            {pagination}
          </div>
        ) : null}
      </div>

      <div className="hidden md:block">
        <TableFrame footer={pagination}>
          <Table>
            <TableHeader sticky>
              <TableRow className="hover:bg-transparent">
                <SortableTableHead
                  label="Order #"
                  sortKey="order_number"
                  pathname={ORDERS_PATH}
                  currentSort={sort}
                  currentDir={sortDir}
                  baseParams={baseParams}
                />
                <SortableTableHead
                  label="Customer"
                  sortKey="customer_name"
                  pathname={ORDERS_PATH}
                  currentSort={sort}
                  currentDir={sortDir}
                  baseParams={baseParams}
                />
                <SortableTableHead
                  label="Status"
                  sortKey="status"
                  pathname={ORDERS_PATH}
                  currentSort={sort}
                  currentDir={sortDir}
                  baseParams={baseParams}
                />
                <SortableTableHead
                  label="Total"
                  sortKey="total_amount"
                  pathname={ORDERS_PATH}
                  currentSort={sort}
                  currentDir={sortDir}
                  baseParams={baseParams}
                  align="right"
                />
                <TableHead>Source</TableHead>
                <SortableTableHead
                  label="Created"
                  sortKey="ordered_at"
                  pathname={ORDERS_PATH}
                  currentSort={sort}
                  currentDir={sortDir}
                  baseParams={baseParams}
                />
                <TableHead>Sync</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="min-w-[8rem] whitespace-normal">
                    <p className="font-mono text-caption font-medium text-foreground">
                      {order.orderNumber ?? order.id.slice(0, 8)}
                    </p>
                  </TableCell>
                  <TableCell className="text-foreground">{order.customerName ?? "—"}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(order.total, order.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      {sourceLabels[order.source]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <OrderSyncStatusBadge status={order.syncStatus} />
                  </TableCell>
                  <TableActionsCell>
                    <Button
                      href={`/orders?q=${encodeURIComponent(order.orderNumber ?? order.id.slice(0, 8))}`}
                      variant="ghost"
                      size="sm"
                    >
                      View
                    </Button>
                  </TableActionsCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableFrame>
      </div>
    </>
  );
}
