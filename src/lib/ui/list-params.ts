export function buildProductsListParams(filters: {
  query: string;
  status: string;
  stock: string;
}): Record<string, string | undefined> {
  return {
    q: filters.query || undefined,
    status: filters.status !== "all" ? filters.status : undefined,
    stock: filters.stock !== "all" ? filters.stock : undefined
  };
}

export function buildOrdersListParams(filters: {
  query: string;
  orderStatus: string;
  source: string;
  sync: string;
}): Record<string, string | undefined> {
  return {
    q: filters.query || undefined,
    status: filters.orderStatus !== "all" ? filters.orderStatus : undefined,
    source: filters.source !== "all" ? filters.source : undefined,
    sync: filters.sync !== "all" ? filters.sync : undefined
  };
}
