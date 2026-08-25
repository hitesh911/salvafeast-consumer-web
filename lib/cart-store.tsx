"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { buildCartLineKey } from "@/lib/cart-utils";
import type { DietaryType, OrderType, PublicMenuResponse } from "./types";

export interface CartAddon {
  id: string;
  name: string;
  price: string;
}

export interface CartLine {
  key: string;
  menuItemId: string;
  name: string;
  variantId: string | null;
  variantName: string | null;
  addons: CartAddon[];
  quantity: number;
  unitPrice: number;
  imageUrl?: string | null;
  dietaryType?: DietaryType | null;
  notes?: string;
}

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  tableToken: string | null;
  menuContext: PublicMenuResponse | null;
  setMenuContext: (ctx: PublicMenuResponse | null) => void;
  setTableToken: (token: string | null) => void;
  addLine: (line: Omit<CartLine, "key">) => void;
  updateQuantity: (key: string, quantity: number) => void;
  updateLineNotes: (key: string, notes: string) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  defaultOrderType: OrderType;
}

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(slug: string) {
  return `salva-cart:${slug}`;
}

export function CartProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [tableToken, setTableTokenState] = useState<string | null>(null);
  const [menuContext, setMenuContext] = useState<PublicMenuResponse | null>(
    null,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey(slug));
      if (raw) {
        const parsed = JSON.parse(raw) as {
          lines?: CartLine[];
          tableToken?: string | null;
        };
        if (parsed.lines) setLines(parsed.lines);
        if (parsed.tableToken) setTableTokenState(parsed.tableToken);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, [slug]);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(
      storageKey(slug),
      JSON.stringify({ lines, tableToken }),
    );
  }, [slug, lines, tableToken, hydrated]);

  const setTableToken = useCallback((token: string | null) => {
    setTableTokenState(token);
  }, []);

  const addLine = useCallback((line: Omit<CartLine, "key">) => {
    const key = buildCartLineKey(
      line.menuItemId,
      line.variantId,
      line.addons.map((a) => a.id),
      line.notes,
    );
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) =>
          l.key === key ? { ...l, quantity: l.quantity + line.quantity } : l,
        );
      }
      return [...prev, { ...line, key }];
    });
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      setLines((prev) => prev.filter((l) => l.key !== key));
      return;
    }
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, quantity } : l)),
    );
  }, []);

  const updateLineNotes = useCallback((key: string, notes: string) => {
    setLines((prev) => {
      const current = prev.find((line) => line.key === key);
      if (!current) return prev;

      const trimmed = notes.trim();
      const nextKey = buildCartLineKey(
        current.menuItemId,
        current.variantId,
        current.addons.map((addon) => addon.id),
        trimmed,
      );

      if (nextKey === key) {
        return prev.map((line) =>
          line.key === key ? { ...line, notes: trimmed || undefined } : line,
        );
      }

      const duplicate = prev.find((line) => line.key === nextKey);
      if (duplicate) {
        return prev
          .map((line) =>
            line.key === nextKey
              ? {
                  ...line,
                  quantity: line.quantity + current.quantity,
                  notes: trimmed || undefined,
                }
              : line,
          )
          .filter((line) => line.key !== key);
      }

      return prev.map((line) =>
        line.key === key
          ? { ...line, key: nextKey, notes: trimmed || undefined }
          : line,
      );
    });
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines],
  );

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    [lines],
  );

  const defaultOrderType = menuContext?.ordering.default_order_type ?? "counter";

  const value = useMemo(
    () => ({
      lines,
      itemCount,
      subtotal,
      tableToken,
      menuContext,
      setMenuContext,
      setTableToken,
      addLine,
      updateQuantity,
      updateLineNotes,
      removeLine,
      clearCart,
      defaultOrderType,
    }),
    [
      lines,
      itemCount,
      subtotal,
      tableToken,
      menuContext,
      setTableToken,
      addLine,
      updateQuantity,
      updateLineNotes,
      removeLine,
      clearCart,
      defaultOrderType,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
