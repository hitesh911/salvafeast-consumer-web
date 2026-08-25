import type { OrderPlacementResponse } from "./types";

const PREFIX = "salva-order-cache:";

export function savePlacedOrder(
  slug: string,
  orderId: string,
  payload: OrderPlacementResponse,
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
): OrderPlacementResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${slug}:${orderId}`);
    if (!raw) return null;
    return JSON.parse(raw) as OrderPlacementResponse;
  } catch {
    return null;
  }
}
