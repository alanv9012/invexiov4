"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchProductsForPaletteAction } from "@/features/products/palette-actions";
import type { PaletteProduct } from "@/features/products/palette-search";
import { StockAdjustmentDialog } from "@/features/products/stock-adjustment-dialog";
import { useEscapeKey } from "@/lib/ui/use-escape-key";
import { formatShortcut } from "@/lib/ui/use-keyboard-shortcut";
import { cn } from "@/lib/ui/cn";

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
};

type PaletteItem =
  | {
      kind: "nav";
      id: string;
      label: string;
      hint?: string;
      href: string;
      keywords: string[];
    }
  | {
      kind: "action";
      id: string;
      label: string;
      hint?: string;
      keywords: string[];
      run: () => void;
    }
  | {
      kind: "product";
      id: string;
      label: string;
      hint: string;
      product: PaletteProduct;
      keywords: string[];
    };

const NAV_ITEMS: Omit<Extract<PaletteItem, { kind: "nav" }>, "kind">[] = [
  { id: "nav-dashboard", label: "Go to Dashboard", href: "/", keywords: ["home", "dashboard"] },
  { id: "nav-products", label: "Go to Products", href: "/products", keywords: ["catalog", "sku"] },
  { id: "nav-inventory", label: "Go to Inventory", href: "/inventory", keywords: ["stock", "movements"] },
  { id: "nav-orders", label: "Go to Orders", href: "/orders", keywords: ["sales", "manual"] },
  { id: "nav-sync", label: "Go to Sync", href: "/sync", keywords: ["woocommerce", "import"] },
  { id: "nav-settings", label: "Go to Settings", href: "/settings", keywords: ["preferences", "account"] }
];

function matchesQuery(item: { label: string; keywords: string[] }, query: string): boolean {
  if (!query) return true;
  const haystack = [item.label, ...item.keywords].join(" ").toLowerCase();
  return haystack.includes(query);
}

export function CommandPalette({ open, onClose, initialQuery = "" }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [activeIndex, setActiveIndex] = useState(0);
  const [products, setProducts] = useState<PaletteProduct[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<PaletteProduct | null>(null);

  const openAdjust = useCallback((product: PaletteProduct) => {
    setAdjustProduct(product);
    onClose();
  }, [onClose]);

  const staticItems = useMemo((): PaletteItem[] => {
    const normalized = query.trim().toLowerCase();
    const nav: PaletteItem[] = NAV_ITEMS.filter((item) => matchesQuery(item, normalized)).map(
      (item) => ({ kind: "nav", ...item })
    );

    const actions: PaletteItem[] = [
      {
        kind: "action",
        id: "action-create-order",
        label: "Create manual order",
        hint: "Orders page",
        keywords: ["new", "order", "manual"],
        run: () => router.push("/orders")
      }
    ].filter((item) => matchesQuery(item, normalized));

    const productItems: PaletteItem[] = products.map((product) => ({
      kind: "product",
      id: `product-${product.id}`,
      label: product.name,
      hint: `${product.sku} · ${product.stockQuantity} in stock`,
      product,
      keywords: [product.sku, product.name]
    }));

    return [...actions, ...nav, ...productItems];
  }, [products, query, router]);

  const items = staticItems;

  useEscapeKey(onClose, open && !adjustProduct);

  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery);
    setActiveIndex(0);
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [initialQuery, open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setProducts([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = window.setTimeout(async () => {
      const result = await searchProductsForPaletteAction(trimmed);
      setProducts(result.products);
      setSearchError(result.errorMessage);
      setIsSearching(false);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [open, query]);

  useEffect(() => {
    setActiveIndex((current) => (items.length === 0 ? 0 : Math.min(current, items.length - 1)));
  }, [items.length]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const runItem = useCallback(
    (item: PaletteItem) => {
      if (item.kind === "nav") {
        router.push(item.href);
        onClose();
        return;
      }
      if (item.kind === "action") {
        item.run();
        onClose();
        return;
      }
      router.push(`/products?q=${encodeURIComponent(item.product.sku)}`);
      onClose();
    },
    [onClose, router]
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (items.length === 0 ? 0 : (current + 1) % items.length));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        items.length === 0 ? 0 : (current - 1 + items.length) % items.length
      );
      return;
    }
    if (event.key === "Enter" && items[activeIndex]) {
      event.preventDefault();
      const item = items[activeIndex];
      if (event.shiftKey && item.kind === "product") {
        openAdjust(item.product);
        return;
      }
      runItem(item);
    }
  };

  return (
    <>
      {open ? (
      <div
        className="fixed inset-0 z-[60] flex animate-fade-in items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-[1px] sm:pt-[15vh]"
        role="presentation"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          className="flex max-h-[min(70dvh,32rem)] w-full max-w-xl animate-slide-up flex-col overflow-hidden rounded-card border border-border bg-surface shadow-modal motion-reduce:animate-none"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={onKeyDown}
        >
          <div className="border-b border-border px-3 py-2">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search commands or products…"
              className="w-full bg-transparent px-2 py-2 text-body-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Command palette search"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-body-sm text-muted-foreground">
                {isSearching ? "Searching…" : query.trim() ? "No matches found." : "Type to search products or commands."}
              </p>
            ) : (
              <ul role="listbox" aria-label="Commands and products">
                {items.map((item, index) => (
                  <li key={item.id} role="option" aria-selected={index === activeIndex}>
                    <button
                      type="button"
                      data-active={index === activeIndex ? "true" : undefined}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-body-sm transition",
                        index === activeIndex ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-surface-muted"
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => runItem(item)}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{item.label}</span>
                        {item.kind === "product" ? (
                          <span className="mt-0.5 block truncate text-caption text-muted-foreground">
                            {item.hint} · Enter to view, Shift+Enter to adjust stock
                          </span>
                        ) : "hint" in item && item.hint ? (
                          <span className="mt-0.5 block text-caption text-muted-foreground">{item.hint}</span>
                        ) : null}
                      </span>
                      {item.kind === "product" ? (
                        <span className="shrink-0 text-caption text-muted-foreground">Product</span>
                      ) : item.kind === "nav" ? (
                        <span className="shrink-0 text-caption text-muted-foreground">Go</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {searchError ? (
              <p className="px-3 py-2 text-caption text-danger-foreground">{searchError}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border px-4 py-2 text-caption text-muted-foreground">
            <span>
              <kbd className="rounded border border-border px-1">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="rounded border border-border px-1">↵</kbd> run
            </span>
            <span>
              <kbd className="rounded border border-border px-1">⇧↵</kbd> adjust stock
            </span>
            <span>
              <kbd className="rounded border border-border px-1">esc</kbd> close
            </span>
            <span className="ml-auto">{formatShortcut("mod+k")} palette</span>
          </div>
        </div>
      </div>
      ) : null}

      <StockAdjustmentDialog
        open={Boolean(adjustProduct)}
        onClose={() => setAdjustProduct(null)}
        product={
          adjustProduct
            ? {
                id: adjustProduct.id,
                name: adjustProduct.name,
                stockQuantity: adjustProduct.stockQuantity
              }
            : null
        }
      />
    </>
  );
}
