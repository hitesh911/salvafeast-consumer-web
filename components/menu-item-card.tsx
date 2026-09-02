"use client";

import { useState } from "react";
import { Minus, Plus, Leaf } from "lucide-react";
import { calcItemUnitPrice, formatPrice, formatPriceDelta } from "@/lib/api";
import { useCart } from "@/lib/cart-store";
import type { PublicMenuItem } from "@/lib/types";
import clsx from "clsx";

interface MenuItemCardProps {
  item: PublicMenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { addLine } = useCart();
  const [expanded, setExpanded] = useState(false);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = item.variants.find((v) => v.id === variantId) ?? null;
  const selectedAddonObjects = item.addons.filter((a) =>
    selectedAddons.has(a.id),
  );

  const unitPrice = calcItemUnitPrice(
    item.base_price,
    selectedVariant?.price_delta,
    selectedAddonObjects.map((a) => a.price),
  );

  const basePrice = parseFloat(item.base_price);
  const hasVariantOrAddonSelected =
    selectedVariant !== null || selectedAddonObjects.length > 0;

  const listPriceLabel =
    hasVariantOrAddonSelected || item.variants.length === 0
      ? formatPrice(unitPrice)
      : item.variants.length === 1
        ? formatPrice(basePrice)
        : `From ${formatPrice(
            Math.min(
              ...item.variants.map(
                (v) => basePrice + parseFloat(v.price_delta),
              ),
            ),
          )}`;

  const hasOptions = item.variants.length > 0 || item.addons.length > 0;
  const imageUrl = item.images[0]?.image_url;

  function toggleAddon(id: string) {
    setSelectedAddons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetCustomization() {
    setQuantity(1);
    setSelectedAddons(new Set());
    setVariantId(null);
  }

  function handleQuickAdd() {
    addLine({
      menuItemId: item.id,
      name: item.name,
      variantId: null,
      variantName: null,
      addons: [],
      quantity: 1,
      unitPrice: basePrice,
      imageUrl: imageUrl ?? null,
      dietaryType: item.dietary_type,
    });
  }

  function handleCustomAdd() {
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
      unitPrice,
      imageUrl: imageUrl ?? null,
      dietaryType: item.dietary_type,
    });
    setExpanded(false);
    resetCustomization();
  }

  function toggleCustomize() {
    setExpanded((open) => {
      if (open) resetCustomization();
      return !open;
    });
  }

  return (
    <article className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="flex gap-3 p-3">
        {imageUrl ? (
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand text-xl font-bold">
            {item.name.charAt(0)}
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start gap-1.5">
            {item.dietary_type ? (
              <span
                className={clsx(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] font-bold leading-none",
                  item.dietary_type === "veg" &&
                    "border-green-600 text-green-600",
                  item.dietary_type === "vegan" &&
                    "border-lime-600 text-lime-700",
                  item.dietary_type === "non_veg" &&
                    "border-red-600 text-red-600",
                )}
                title={
                  item.dietary_type === "veg"
                    ? "Vegetarian"
                    : item.dietary_type === "vegan"
                      ? "Vegan"
                      : "Non-vegetarian"
                }
              >
                {item.dietary_type === "non_veg" ? (
                  "NV"
                ) : item.dietary_type === "vegan" ? (
                  "VG"
                ) : (
                  <Leaf className="h-2.5 w-2.5" />
                )}
              </span>
            ) : null}
            <h3 className="font-semibold leading-tight text-stone-900">
              {item.name}
            </h3>
          </div>

          {item.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">
              {item.description}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <span className="font-semibold text-brand">{listPriceLabel}</span>

            <div className="flex shrink-0 items-center gap-2">
              {hasOptions ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleCustomize();
                  }}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 active:scale-95"
                >
                  {expanded ? "Close" : "Customize"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleQuickAdd();
                }}
                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white active:scale-95"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div
          className="border-t border-stone-100 bg-stone-50 px-3 py-3"
          onClick={(event) => event.stopPropagation()}
        >
          {item.variants.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-stone-500">
                {item.variants.length > 1 ? "Choose size" : "Options"}
              </p>
              <div className="flex flex-wrap gap-2">
                {item.variants.length > 1 ? null : (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setVariantId(null);
                    }}
                    className={clsx(
                      "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                      variantId === null
                        ? "border-brand bg-brand text-white"
                        : "border-stone-200 bg-white text-stone-700",
                    )}
                  >
                    Regular
                  </button>
                )}
                {item.variants.map((v) => {
                  const deltaLabel = formatPriceDelta(v.price_delta);
                  return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setVariantId(v.id);
                    }}
                    className={clsx(
                      "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                      variantId === v.id
                        ? "border-brand bg-brand text-white"
                        : "border-stone-200 bg-white text-stone-700",
                    )}
                  >
                    {v.name}
                    {deltaLabel ? ` (${deltaLabel})` : ""}
                  </button>
                  );
                })}
              </div>
            </div>
          )}

          {item.addons.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-stone-500">
                Add-ons
              </p>
              <div className="space-y-1.5">
                {item.addons.map((addon) => (
                  <label
                    key={addon.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedAddons.has(addon.id)}
                        onChange={() => toggleAddon(addon.id)}
                        className="h-4 w-4 rounded border-stone-300 text-brand accent-brand"
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

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-2 py-1">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setQuantity((q) => Math.max(1, q - 1));
                }}
                className="rounded p-1 text-stone-500 hover:text-stone-800"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center text-sm font-medium">
                {quantity}
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setQuantity((q) => q + 1);
                }}
                className="rounded p-1 text-stone-500 hover:text-stone-800"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleCustomAdd();
              }}
              disabled={item.variants.length > 1 && !variantId}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-40 active:scale-95"
            >
              Add to cart · {formatPrice(unitPrice * quantity)}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
