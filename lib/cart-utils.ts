import type { CartLine } from "@/lib/cart-store";
import type { DietaryType, PublicMenuItem, PublicMenuResponse } from "@/lib/types";

export function buildCartLineKey(
  menuItemId: string,
  variantId: string | null,
  addonIds: string[],
  notes?: string,
): string {
  const sortedAddons = [...addonIds].sort().join(",");
  const notePart = (notes ?? "").trim().toLowerCase();
  return `${menuItemId}:${variantId ?? "none"}:${sortedAddons}:${notePart}`;
}

export function findMenuItem(
  menuContext: PublicMenuResponse | null,
  menuItemId: string,
): PublicMenuItem | null {
  if (!menuContext) return null;
  for (const category of menuContext.menu) {
    const item = category.items.find((row) => row.id === menuItemId);
    if (item) return item;
  }
  return null;
}

export function resolveLineImageUrl(
  line: CartLine,
  menuContext: PublicMenuResponse | null,
): string | null {
  if (line.imageUrl) return line.imageUrl;
  const item = findMenuItem(menuContext, line.menuItemId);
  return item?.images[0]?.image_url ?? null;
}

export function resolveLineDietaryType(
  line: CartLine,
  menuContext: PublicMenuResponse | null,
): DietaryType | null {
  if (line.dietaryType) return line.dietaryType;
  const item = findMenuItem(menuContext, line.menuItemId);
  return item?.dietary_type ?? null;
}

export function formatLineCustomizations(line: CartLine): string | null {
  const parts: string[] = [];
  if (line.variantName) parts.push(line.variantName);
  if (line.addons.length > 0) {
    parts.push(line.addons.map((addon) => `+ ${addon.name}`).join(", "));
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}
