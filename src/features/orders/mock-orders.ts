import type { OrderRow } from "@/features/orders/types";

export const MOCK_ORDERS: OrderRow[] = [
  {
    id: "o-1",
    orderNumber: "INV-1042",
    customerName: "Alex Rivera",
    status: "processing",
    total: 128.5,
    currency: "USD",
    source: "woocommerce",
    createdAt: "2026-05-10T14:22:00.000Z",
    syncStatus: "synced"
  },
  {
    id: "o-2",
    orderNumber: "INV-1041",
    customerName: "Jordan Lee",
    status: "completed",
    total: 64.0,
    currency: "USD",
    source: "manual",
    createdAt: "2026-05-10T11:05:00.000Z",
    syncStatus: "pending"
  },
  {
    id: "o-3",
    orderNumber: "INV-1040",
    customerName: "Sam Morgan",
    status: "on-hold",
    total: 210.99,
    currency: "USD",
    source: "woocommerce",
    createdAt: "2026-05-09T18:40:00.000Z",
    syncStatus: "failed"
  },
  {
    id: "o-4",
    orderNumber: "INV-1039",
    customerName: "Taylor Chen",
    status: "pending",
    total: 42.25,
    currency: "USD",
    source: "manual",
    createdAt: "2026-05-09T09:15:00.000Z",
    syncStatus: "synced"
  },
  {
    id: "o-5",
    orderNumber: "INV-1038",
    customerName: "Riley Brooks",
    status: "cancelled",
    total: 0,
    currency: "USD",
    source: "system",
    createdAt: "2026-05-08T16:00:00.000Z",
    syncStatus: "pending"
  }
];
