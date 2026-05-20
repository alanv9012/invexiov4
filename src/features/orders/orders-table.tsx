import { formatDateTime, formatMoney } from "@/lib/format";
import type { OrderRow, OrderSource } from "@/features/orders/types";
import { OrderStatusBadge, OrderSyncStatusBadge } from "@/components/ui/inventory-badges";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

type OrdersTableProps = {
  orders: OrderRow[];
};

const sourceLabels: Record<OrderSource, string> = {
  manual: "Manual",
  woocommerce: "WooCommerce",
  system: "System"
};

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Sync</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-caption font-medium text-foreground">
                {order.orderNumber}
              </TableCell>
              <TableCell className="text-foreground">{order.customerName ?? "—"}</TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell>{formatMoney(order.total, order.currency)}</TableCell>
              <TableCell>
                <Badge variant="neutral" size="sm">
                  {sourceLabels[order.source]}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDateTime(order.createdAt)}</TableCell>
              <TableCell>
                <OrderSyncStatusBadge status={order.syncStatus} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
