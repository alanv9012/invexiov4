import type { DailyCountPoint, DailyMovementPoint, TrendInsight } from "@/features/dashboard/analytics";

export type DashboardRecentOrder = {
  id: string;
  orderNumber: string | null;
  customerName: string | null;
  status: string;
  totalAmount: number;
  orderedAt: string;
};

export type DashboardRecentMovement = {
  id: string;
  productName: string;
  changeQuantity: number;
  reason: string;
  source: string;
  createdAt: string;
};

export type DashboardSyncSummaryItem = {
  type: string;
  status: string;
  count: number;
};

export type DashboardLowStockProduct = {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
};

export type DashboardActivityItem =
  | {
      type: "order";
      id: string;
      title: string;
      subtitle: string;
      timestamp: string;
      status: string;
      amount: number;
    }
  | {
      type: "movement";
      id: string;
      title: string;
      subtitle: string;
      timestamp: string;
      changeQuantity: number;
      source: string;
    };

export type DashboardMetricTrends = {
  orders: TrendInsight;
  movements: TrendInsight;
  lowStock: TrendInsight;
};

export type DashboardData = {
  totalProducts: number;
  lowStockProducts: number;
  recentOrdersCount: number;
  failedSyncs: number;
  movementsToday: number;
  recentOrders: DashboardRecentOrder[];
  recentMovements: DashboardRecentMovement[];
  syncSummary: DashboardSyncSummaryItem[];
  orderVolumeByDay: DailyCountPoint[];
  movementActivityByDay: DailyMovementPoint[];
  lowStockItems: DashboardLowStockProduct[];
  activityFeed: DashboardActivityItem[];
  metricTrends: DashboardMetricTrends;
  errorMessage: string | null;
};
