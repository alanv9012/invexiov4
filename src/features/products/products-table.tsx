import Image from "next/image";
import { InventoryAdjustmentDrawer } from "@/features/products/inventory-adjustment-drawer";
import type { ProductItem, ProductSortKey } from "@/features/products/types";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { SortDirection } from "@/lib/ui/table-params";
import { ProductSyncStatusBadge, StockQuantityCell } from "@/components/ui/inventory-badges";
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

const PRODUCTS_PATH = "/products";

type ProductsTableProps = {
  products: ProductItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  sort: ProductSortKey;
  sortDir: SortDirection;
  baseParams: Record<string, string | undefined>;
};

export function ProductsTable({
  products,
  totalCount,
  page,
  pageSize,
  sort,
  sortDir,
  baseParams
}: ProductsTableProps) {
  const pagination = (
    <TablePagination
      pathname={PRODUCTS_PATH}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
      baseParams={{ ...baseParams, sort, dir: sortDir }}
    />
  );

  return (
    <>
      <div className="space-y-3 md:hidden">
        {products.map((product) => (
          <Card key={product.id} padding="sm" className="space-y-3">
            <div className="flex gap-3">
              <Image
                src={product.thumbnailPath}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-md border border-border object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{product.name}</p>
                <p className="font-mono text-caption text-muted-foreground">{product.sku}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ProductSyncStatusBadge status={product.syncStatus} />
                  <StockQuantityCell quantity={product.stockQuantity} />
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-2 text-caption">
              <div>
                <dt className="text-muted-foreground">Price</dt>
                <dd className="font-medium tabular-nums text-foreground">{formatMoney(product.price)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last synced</dt>
                <dd className="text-foreground">
                  {product.lastSyncedAt ? formatDateTime(product.lastSyncedAt) : "Never"}
                </dd>
              </div>
            </dl>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                href={`/products?q=${encodeURIComponent(product.sku)}`}
                variant="secondary"
                className="w-full sm:flex-1"
              >
                View
              </Button>
              <div className="w-full sm:flex-1 [&_button]:w-full">
                <InventoryAdjustmentDrawer
                  productId={product.id}
                  productName={product.name}
                  currentStock={product.stockQuantity}
                />
              </div>
            </div>
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
                  label="Product"
                  sortKey="name"
                  pathname={PRODUCTS_PATH}
                  currentSort={sort}
                  currentDir={sortDir}
                  baseParams={baseParams}
                />
                <SortableTableHead
                  label="SKU"
                  sortKey="sku"
                  pathname={PRODUCTS_PATH}
                  currentSort={sort}
                  currentDir={sortDir}
                  baseParams={baseParams}
                />
                <SortableTableHead
                  label="Price"
                  sortKey="price"
                  pathname={PRODUCTS_PATH}
                  currentSort={sort}
                  currentDir={sortDir}
                  baseParams={baseParams}
                />
                <SortableTableHead
                  label="Stock"
                  sortKey="stock_quantity"
                  pathname={PRODUCTS_PATH}
                  currentSort={sort}
                  currentDir={sortDir}
                  baseParams={baseParams}
                />
                <TableHead>Sync</TableHead>
                <SortableTableHead
                  label="Last synced"
                  sortKey="last_synced_at"
                  pathname={PRODUCTS_PATH}
                  currentSort={sort}
                  currentDir={sortDir}
                  baseParams={baseParams}
                />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="min-w-[12rem] whitespace-normal">
                    <div className="flex items-center gap-3">
                      <Image
                        src={product.thumbnailPath}
                        alt=""
                        width={40}
                        height={40}
                        className="rounded-md border border-border"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{product.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-caption text-muted-foreground">
                    {product.sku}
                  </TableCell>
                  <TableCell className="tabular-nums">{formatMoney(product.price)}</TableCell>
                  <TableCell>
                    <StockQuantityCell quantity={product.stockQuantity} />
                  </TableCell>
                  <TableCell>
                    <ProductSyncStatusBadge status={product.syncStatus} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.lastSyncedAt ? formatDateTime(product.lastSyncedAt) : "Never"}
                  </TableCell>
                  <TableActionsCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button href={`/products?q=${encodeURIComponent(product.sku)}`} variant="ghost" size="sm">
                        View
                      </Button>
                      <InventoryAdjustmentDrawer
                        productId={product.id}
                        productName={product.name}
                        currentStock={product.stockQuantity}
                      />
                    </div>
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
