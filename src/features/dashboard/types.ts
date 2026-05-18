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

export type DashboardData = {
  totalProducts: number;
  lowStockProducts: number;
  recentOrdersCount: number;
  failedSyncs: number;
  movementsToday: number;
  recentOrders: DashboardRecentOrder[];
  recentMovements: DashboardRecentMovement[];
  syncSummary: DashboardSyncSummaryItem[];
  errorMessage: string | null;
};
