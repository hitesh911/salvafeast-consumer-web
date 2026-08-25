"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import clsx from "clsx";
import { calcItemUnitPrice, formatPrice, formatPriceDelta } from "@/lib/api";
import { useCart } from "@/lib/cart-store";
import type { PublicMenuItem } from "@/lib/types";

type MenuItemSheetProps = {
  item: PublicMenuItem | null;
  onClose: () => void;
};

export function MenuItemSheet({ item, onClose }: MenuItemSheetProps) {
  const { addLine } = useCart();
  const [variantId, setVariantId] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!item) return;
    setVariantId(null);
    setSelectedAddons(new Set());
    setQuantity(1);
  }, [item]);

  if (!item) return null;

  const imageUrl = item.images[0]?.image_url;
  const selectedVariant = item.variants.find((v) => v.id === variantId) ?? null;
  const selectedAddonObjects = item.addons.filter((a) => selectedAddons.has(a.id));
  const unitPrice = calcItemUnitPrice(
    item.base_price,
    selectedVariant?.price_delta,
    selectedAddonObjects.map((a) => a.price),
  );
  const basePrice = parseFloat(item.base_price);
  const hasOptions = item.variants.length > 0 || item.addons.length > 0;

  function toggleAddon(id: string) {
    setSelectedAddons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAdd() {
    if (!item) return;
    if (item.variants.length > 1 && !variantId) return;
    addLine({
      menuItemId: item.id,
      name: item.name,
      variantId,
      variantName: selectedVariant?.name ?? null,
      addons: selectedAddonObjects.map((a) => ({
        id: a.id,
        name: a.name,
        price: a.price,
      })),
      quantity,
      unitPrice: hasOptions ? unitPrice : basePrice,
      imageUrl: imageUrl ?? null,
      dietaryType: item.dietary_type,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white pb-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-1.5 shadow"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-stone-600" />
        </button>

        {imageUrl ? (
          <div className="h-48 w-full bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className="p-4">
          <h2 className="text-xl font-bold text-stone-900">{item.name}</h2>
          {item.description ? (
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              {item.description}
            </p>
          ) : null}
          <p className="mt-3 text-lg font-semibold text-brand">
            {formatPrice(hasOptions ? unitPrice : basePrice)}
          </p>

          {item.variants.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                Options
              </p>
              <div className="flex flex-wrap gap-2">
                {item.variants.length > 1 ? null : (
                  <button
                    type="button"
                    onClick={() => setVariantId(null)}
                    className={clsx(
                      "rounded-lg border px-3 py-2 text-sm",
                      variantId === null
                        ? "border-brand bg-brand text-white"
                        : "border-stone-200",
                    )}
                  >
                    Regular
                  </button>
                )}
                {item.variants.map((variant) => {
                  const deltaLabel = formatPriceDelta(variant.price_delta);
                  return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setVariantId(variant.id)}
                    className={clsx(
                      "rounded-lg border px-3 py-2 text-sm",
                      variantId === variant.id
                        ? "border-brand bg-brand text-white"
                        : "border-stone-200",
                    )}
                  >
                    {variant.name}
                    {deltaLabel ? ` (${deltaLabel})` : ""}
                  </button>
                  );
                })}
              </div>
            </div>
          )}

          {item.addons.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                Add-ons
              </p>
              <div className="space-y-2">
                {item.addons.map((addon) => (
                  <label
                    key={addon.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-stone-200 px-3 py-2"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedAddons.has(addon.id)}
                        onChange={() => toggleAddon(addon.id)}
                        className="h-4 w-4 accent-brand"
                      />
                      {addon.name}
                    </span>
                    <span className="text-sm text-stone-500">
                      +{formatPrice(addon.price)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-stone-200 px-2 py-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="rounded p-1 text-stone-500"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center text-sm font-semibold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="rounded p-1 text-stone-500"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={item.variants.length > 1 && !variantId}
              className="flex-1 rounded-xl bg-brand py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              Add · {formatPrice((hasOptions ? unitPrice : basePrice) * quantity)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
