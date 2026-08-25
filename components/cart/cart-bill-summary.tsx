"use client";

import { formatPrice } from "@/lib/api";

type CartBillSummaryProps = {
  subtotal: number;
  itemCount: number;
  discount?: number;
};

export function CartBillSummary({
  subtotal,
  itemCount,
  discount = 0,
}: CartBillSummaryProps) {
  const grandTotal = Math.max(subtotal - discount, 0);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
        Bill details
      </h2>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between text-stone-700">
          <span>
            Item total ({itemCount} {itemCount === 1 ? "item" : "items"})
          </span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 ? (
          <div className="flex items-center justify-between text-green-700">
            <span>Discount</span>
            <span className="font-medium">−{formatPrice(discount)}</span>
          </div>
        ) : null}
        <p className="text-xs text-stone-400">
          GST or other taxes, if applicable, are added at billing by the outlet.
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
        <span className="text-base font-bold text-stone-900">Grand total</span>
        <span className="text-lg font-bold text-brand">{formatPrice(grandTotal)}</span>
      </div>
    </div>
  );
}
