import Image from "next/image";
import { InventoryAdjustmentDrawer } from "@/features/products/inventory-adjustment-drawer";
import type { ProductItem } from "@/features/products/types";
import { formatDateTime, formatMoney } from "@/lib/format";
import { ProductSyncStatusBadge, StockQuantityCell } from "@/components/ui/inventory-badges";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

type ProductsTableProps = {
  products: ProductItem[];
};

export function ProductsTable({ products }: ProductsTableProps) {
  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Sync status</TableHead>
            <TableHead>Last synced</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Image
                    src={product.thumbnailPath}
                    alt={`${product.name} thumbnail`}
                    width={40}
                    height={40}
                    className="rounded-md border border-border"
                  />
                  <span className="font-medium text-foreground">{product.name}</span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-caption text-muted-foreground">{product.sku}</TableCell>
              <TableCell>{formatMoney(product.price)}</TableCell>
              <TableCell>
                <StockQuantityCell quantity={product.stockQuantity} />
              </TableCell>
              <TableCell>
                <ProductSyncStatusBadge status={product.syncStatus} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {product.lastSyncedAt ? formatDateTime(product.lastSyncedAt) : "Never"}
              </TableCell>
              <TableCell className="text-right">
                <InventoryAdjustmentDrawer
                  productId={product.id}
                  productName={product.name}
                  currentStock={product.stockQuantity}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
