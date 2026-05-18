import Image from "next/image";
import { InventoryAdjustmentDrawer } from "@/features/products/inventory-adjustment-drawer";
import type { ProductItem, ProductSyncStatus } from "@/features/products/types";
import { formatDateTime, formatMoney } from "@/lib/format";

type ProductsTableProps = {
  products: ProductItem[];
};

const statusStyles: Record<ProductSyncStatus, string> = {
  synced: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200"
};

export function ProductsTable({ products }: ProductsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">SKU</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3">Sync status</th>
            <th className="px-4 py-3">Last synced</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product) => (
            <tr key={product.id} className="text-sm text-slate-700">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Image
                    src={product.thumbnailPath}
                    alt={`${product.name} thumbnail`}
                    width={40}
                    height={40}
                    className="rounded-md border border-slate-200"
                  />
                  <span className="font-medium text-slate-900">{product.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-600">{product.sku}</td>
              <td className="px-4 py-3">{formatMoney(product.price)}</td>
              <td className="px-4 py-3">{product.stockQuantity}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[product.syncStatus]}`}
                >
                  {product.syncStatus}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">
                {product.lastSyncedAt ? formatDateTime(product.lastSyncedAt) : "Never"}
              </td>
              <td className="px-4 py-3 text-right">
                <InventoryAdjustmentDrawer
                  productId={product.id}
                  productName={product.name}
                  currentStock={product.stockQuantity}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
