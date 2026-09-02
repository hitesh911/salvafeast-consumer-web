import type { OrderPlacementResponse } from "./types";
import type { OrderLineLabel } from "./order-line-labels";

const PREFIX = "salva-order-cache:";

export type PlacedOrderCache = OrderPlacementResponse & {
  table_qr_token?: string | null;
  line_labels?: OrderLineLabel[];
};

export function savePlacedOrder(
  slug: string,
  orderId: string,
  payload: PlacedOrderCache,
): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    `${PREFIX}${slug}:${orderId}`,
    JSON.stringify(payload),
  );
}

export function getPlacedOrder(
  slug: string,
  orderId: string,
): PlacedOrderCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${slug}:${orderId}`);
    if (!raw) return null;
    return JSON.parse(raw) as PlacedOrderCache;
  } catch {
    return null;
  }
}
