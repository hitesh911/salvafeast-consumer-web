"use client";

import { useEffect, useState } from "react";
import { Leaf, Minus, Plus } from "lucide-react";
import clsx from "clsx";
import { formatPrice } from "@/lib/api";
import type { CartLine } from "@/lib/cart-store";
import {
  formatLineCustomizations,
  resolveLineDietaryType,
  resolveLineImageUrl,
} from "@/lib/cart-utils";
import type { DietaryType, PublicMenuResponse } from "@/lib/types";

type CartLineItemProps = {
  line: CartLine;
  menuContext: PublicMenuResponse | null;
  readOnly?: boolean;
  onUpdateQuantity?: (key: string, quantity: number) => void;
  onUpdateNotes?: (key: string, notes: string) => void;
};

function DietaryDot({ type }: { type: DietaryType }) {
  return (
    <span
      className={clsx(
        "mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border text-[8px] font-bold leading-none",
        type === "veg" && "border-green-600 text-green-600",
        type === "vegan" && "border-lime-600 text-lime-700",
        type === "non_veg" && "border-red-600 text-red-600",
      )}
      title={
        type === "veg"
          ? "Vegetarian"
          : type === "vegan"
            ? "Vegan"
            : "Non-vegetarian"
      }
    >
      {type === "non_veg" ? (
        "NV"
      ) : type === "vegan" ? (
        "VG"
      ) : (
        <Leaf className="h-2 w-2" />
      )}
    </span>
  );
}

export function CartLineItem({
  line,
  menuContext,
  readOnly = false,
  onUpdateQuantity,
  onUpdateNotes,
}: CartLineItemProps) {
  const [notesOpen, setNotesOpen] = useState(Boolean(line.notes));
  const [draftNotes, setDraftNotes] = useState(line.notes ?? "");

  useEffect(() => {
    setDraftNotes(line.notes ?? "");
    if (line.notes) setNotesOpen(true);
  }, [line.key, line.notes]);

  const imageUrl = resolveLineImageUrl(line, menuContext);
  const dietaryType = resolveLineDietaryType(line, menuContext);
  const customizations = formatLineCustomizations(line);

  function commitNotes() {
    if (!onUpdateNotes) return;
    onUpdateNotes(line.key, draftNotes);
  }

  return (
    <article className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
      <div className="flex gap-3">
        {imageUrl ? (
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={line.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-xl font-bold text-brand">
            {line.name.charAt(0)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-1.5">
                {dietaryType ? <DietaryDot type={dietaryType} /> : null}
                <p className="font-semibold leading-tight text-stone-900">
                  {line.name}
                </p>
              </div>
              {customizations ? (
                <p className="mt-1 text-xs text-stone-500">{customizations}</p>
              ) : null}
              {line.notes && readOnly ? (
                <p className="mt-1 text-xs italic text-stone-400">
                  Note: {line.notes}
                </p>
              ) : null}
              <p className="mt-1.5 text-sm font-medium text-stone-700">
                {formatPrice(line.unitPrice)}
              </p>
            </div>

            {readOnly ? (
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium text-stone-500">
                  Qty {line.quantity}
                </p>
                <p className="mt-1 text-sm font-semibold text-stone-900">
                  {formatPrice(line.unitPrice * line.quantity)}
                </p>
              </div>
            ) : (
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-1.5 py-1">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateQuantity?.(line.key, line.quantity - 1)
                    }
                    className="rounded p-1 text-stone-500 hover:text-stone-800"
                    aria-label={
                      line.quantity === 1
                        ? `Remove ${line.name}`
                        : `Decrease quantity of ${line.name}`
                    }
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateQuantity?.(line.key, line.quantity + 1)
                    }
                    className="rounded p-1 text-stone-500 hover:text-stone-800"
                    aria-label={`Increase quantity of ${line.name}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm font-semibold text-stone-900">
                  {formatPrice(line.unitPrice * line.quantity)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {!readOnly && onUpdateNotes ? (
        <div className="mt-3 border-t border-stone-100 pt-3">
          {!notesOpen ? (
            <button
              type="button"
              onClick={() => setNotesOpen(true)}
              className="text-xs font-medium text-brand"
            >
              Add cooking instructions
            </button>
          ) : (
            <div className="space-y-2">
              <label
                htmlFor={`notes-${line.key}`}
                className="block text-xs font-medium text-stone-500"
              >
                Cooking instructions
              </label>
              <textarea
                id={`notes-${line.key}`}
                value={draftNotes}
                onChange={(event) => setDraftNotes(event.target.value)}
                onBlur={commitNotes}
                placeholder="E.g. less spicy, no onion"
                rows={2}
                className="w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}
