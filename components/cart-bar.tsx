"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/api";
import { useCart } from "@/lib/cart-store";
import { resolveLineImageUrl } from "@/lib/cart-utils";

interface CartBarProps {
  slug: string;
}

export function CartBar({ slug }: CartBarProps) {
  const { lines, itemCount, subtotal, menuContext } = useCart();

  if (itemCount === 0) return null;

  const thumbnails = lines.slice(0, 3);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 safe-bottom">
      <div className="mx-auto max-w-lg px-4 pb-4">
        <Link
          href={`/${slug}/cart`}
          className="flex items-center justify-between rounded-2xl bg-brand px-5 py-3.5 text-white shadow-lg transition-transform active:scale-[0.98]"
        >
          <span className="flex items-center gap-3 font-medium">
            <span className="flex items-center -space-x-2">
              {thumbnails.map((line) => {
                const imageUrl = resolveLineImageUrl(line, menuContext);
                return imageUrl ? (
                  <span
                    key={line.key}
                    className="inline-block h-8 w-8 overflow-hidden rounded-full border-2 border-brand bg-stone-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </span>
                ) : (
                  <span
                    key={line.key}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand bg-white/20 text-xs font-bold"
                  >
                    {line.name.charAt(0)}
                  </span>
                );
              })}
            </span>
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
          <span className="font-semibold">
            View cart · {formatPrice(subtotal)}
          </span>
        </Link>
      </div>
    </div>
  );
}
