import type { ProductItem } from "@/features/products/types";

export const MOCK_PRODUCTS: ProductItem[] = [
  {
    id: "p-1",
    thumbnailPath: "/product-placeholder.svg",
    sku: "INV-TSH-001",
    name: "Core Cotton T-Shirt",
    price: 24.99,
    stockQuantity: 120,
    syncStatus: "synced",
    lastSyncedAt: "2026-05-01T16:20:00.000Z"
  },
  {
    id: "p-2",
    thumbnailPath: "/product-placeholder.svg",
    sku: "INV-HOD-002",
    name: "Heavyweight Hoodie",
    price: 54.0,
    stockQuantity: 8,
    syncStatus: "pending",
    lastSyncedAt: "2026-05-01T15:10:00.000Z"
  },
  {
    id: "p-3",
    thumbnailPath: "/product-placeholder.svg",
    sku: "INV-CAP-003",
    name: "Classic Snapback Cap",
    price: 19.5,
    stockQuantity: 0,
    syncStatus: "failed",
    lastSyncedAt: null
  },
  {
    id: "p-4",
    thumbnailPath: "/product-placeholder.svg",
    sku: "INV-JKT-004",
    name: "Windbreaker Jacket",
    price: 89.99,
    stockQuantity: 43,
    syncStatus: "synced",
    lastSyncedAt: "2026-05-01T14:42:00.000Z"
  },
  {
    id: "p-5",
    thumbnailPath: "/product-placeholder.svg",
    sku: "INV-BAG-005",
    name: "Canvas Utility Tote",
    price: 32.25,
    stockQuantity: 5,
    syncStatus: "pending",
    lastSyncedAt: "2026-04-30T22:00:00.000Z"
  }
];
