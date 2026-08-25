import { formatPrice } from "@/lib/api";
import type { PublicOrderItemStatus } from "@/lib/types";

type OrderLineSummaryProps = {
  items: PublicOrderItemStatus[];
  itemNames?: Record<string, string>;
};

export function OrderLineSummary({ items, itemNames = {} }: OrderLineSummaryProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
        Order items
      </h2>
      <ul className="space-y-2 text-sm">
        {items.map((item, index) => (
          <li key={`${item.menu_item_id}-${index}`} className="flex justify-between gap-2">
            <span className="text-stone-700">
              {item.quantity}×{" "}
              {itemNames[item.menu_item_id] ?? `Item ${index + 1}`}
              {item.notes ? (
                <span className="block text-xs italic text-stone-400">{item.notes}</span>
              ) : null}
            </span>
            <span className="shrink-0 font-medium">
              {formatPrice(parseFloat(item.item_price_at_order) * item.quantity)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
