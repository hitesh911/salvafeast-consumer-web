import type { PublicMenuResponse } from "./types";
import type { PublicOrderItemStatus } from "./types";

export type OrderLineLabel = {
  menu_item_id: string;
  variant_id: string | null;
  addon_ids: string[];
  label: string;
};

export function buildCartLineLabel(
  name: string,
  variantName: string | null,
  addonNames: string[],
): string {
  let label = name;
  if (variantName) label += ` (${variantName})`;
  if (addonNames.length > 0) label += ` + ${addonNames.join(", ")}`;
  return label;
}

export function orderLineKey(
  menuItemId: string,
  variantId: string | null,
  addonIds: string[],
): string {
  const sortedAddons = [...addonIds].sort().join(",");
  return `${menuItemId}:${variantId ?? ""}:${sortedAddons}`;
}

export function keyFromOrderItem(item: PublicOrderItemStatus): string {
  return orderLineKey(
    item.menu_item_id,
    item.variant_id,
    (item.addons ?? []).map((a) => a.addon_id),
  );
}

export function keyFromLineLabel(label: OrderLineLabel): string {
  return orderLineKey(label.menu_item_id, label.variant_id, label.addon_ids);
}

export function resolveLabelFromMenu(
  menu: PublicMenuResponse,
  item: PublicOrderItemStatus,
  fallbackIndex: number,
): string {
  const menuItem = menu.menu
    .flatMap((c) => c.items)
    .find((entry) => entry.id === item.menu_item_id);
  if (!menuItem) return `Item ${fallbackIndex + 1}`;

  const variant = item.variant_id
    ? menuItem.variants.find((v) => v.id === item.variant_id)
    : null;
  const addonIds = new Set((item.addons ?? []).map((a) => a.addon_id));
  const addonNames = menuItem.addons
    .filter((a) => addonIds.has(a.id))
    .map((a) => a.name);

  return buildCartLineLabel(
    menuItem.name,
    variant?.name ?? null,
    addonNames,
  );
}

export function labelsFromCache(
  items: PublicOrderItemStatus[],
  cachedLabels: OrderLineLabel[] | undefined,
): string[] {
  const byKey = new Map(
    (cachedLabels ?? []).map((entry) => [keyFromLineLabel(entry), entry.label]),
  );
  return items.map((item, index) => {
    const cached = byKey.get(keyFromOrderItem(item));
    return cached ?? "";
  });
}
