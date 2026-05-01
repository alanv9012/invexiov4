import "server-only";

type WooProduct = {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number | null;
  manage_stock: boolean;
  price: string;
  status: string;
};

type WooOrder = {
  id: number;
  status: string;
  currency: string;
  total: string;
  date_created: string;
};

type GetProductsOptions = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
};

type GetOrdersOptions = {
  page?: number;
  perPage?: number;
  status?: string;
};

type CreateOrderInput = {
  billing?: Record<string, unknown>;
  shipping?: Record<string, unknown>;
  line_items: Array<{
    product_id: number;
    quantity: number;
  }>;
  customer_note?: string;
};

type WooCommerceConfig = {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
};

export class WooCommerceApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "WooCommerceApiError";
    this.status = status;
  }
}

function getRequiredEnv(key: "WOOCOMMERCE_STORE_URL" | "WOOCOMMERCE_CONSUMER_KEY" | "WOOCOMMERCE_CONSUMER_SECRET"): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function getWooCommerceConfig(): WooCommerceConfig {
  return {
    storeUrl: getRequiredEnv("WOOCOMMERCE_STORE_URL"),
    consumerKey: getRequiredEnv("WOOCOMMERCE_CONSUMER_KEY"),
    consumerSecret: getRequiredEnv("WOOCOMMERCE_CONSUMER_SECRET")
  };
}

function createAuthHeader(key: string, secret: string): string {
  const credentials = Buffer.from(`${key}:${secret}`).toString("base64");
  return `Basic ${credentials}`;
}

export class WooCommerceClient {
  private readonly storeUrl: string;
  private readonly authHeader: string;

  constructor() {
    const config = getWooCommerceConfig();
    this.storeUrl = config.storeUrl.replace(/\/$/, "");
    this.authHeader = createAuthHeader(config.consumerKey, config.consumerSecret);
  }

  async getProducts(options: GetProductsOptions = {}): Promise<WooProduct[]> {
    return this.request<WooProduct[]>("/products", {
      page: options.page,
      per_page: options.perPage,
      search: options.search,
      status: options.status
    });
  }

  async getProductById(productId: number): Promise<WooProduct> {
    return this.request<WooProduct>(`/products/${productId}`);
  }

  async updateProductStock(productId: number, stockQuantity: number): Promise<WooProduct> {
    return this.request<WooProduct>(`/products/${productId}`, undefined, {
      method: "PUT",
      body: JSON.stringify({
        manage_stock: true,
        stock_quantity: stockQuantity
      })
    });
  }

  async getOrders(options: GetOrdersOptions = {}): Promise<WooOrder[]> {
    return this.request<WooOrder[]>("/orders", {
      page: options.page,
      per_page: options.perPage,
      status: options.status
    });
  }

  async createOrder(payload: CreateOrderInput): Promise<WooOrder> {
    return this.request<WooOrder>("/orders", undefined, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  private async request<T>(
    endpoint: string,
    query?: Record<string, string | number | undefined>,
    init?: RequestInit
  ): Promise<T> {
    const url = new URL(`${this.storeUrl}/wp-json/wc/v3${endpoint}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      ...init,
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new WooCommerceApiError(`WooCommerce request failed (${response.status})`, response.status);
    }

    return (await response.json()) as T;
  }
}

export function createWooCommerceClient(): WooCommerceClient {
  return new WooCommerceClient();
}
