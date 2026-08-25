"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { CartBillSummary } from "@/components/cart/cart-bill-summary";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { CartOutletHeader } from "@/components/cart/cart-outlet-header";
import { CartStickyFooter } from "@/components/cart/cart-sticky-footer";
import { useCart } from "@/lib/cart-store";

export default function CartPage({ params }: { params: { slug: string } }) {
  const {
    lines,
    subtotal,
    itemCount,
    menuContext,
    updateQuantity,
    updateLineNotes,
  } = useCart();

  return (
    <div className="min-h-dvh bg-stone-50">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link
            href={`/${params.slug}`}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold text-stone-900">Your cart</h1>
        </div>
      </header>

      <div
        className={`mx-auto max-w-lg px-4 py-4 ${itemCount > 0 ? "pb-28" : ""}`}
      >
        {itemCount === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
              <ShoppingBag className="h-8 w-8 text-stone-400" />
            </div>
            <p className="font-medium text-stone-700">Your cart is empty</p>
            <p className="mt-1 text-sm text-stone-500">
              Add items from the menu to get started
            </p>
            <Link
              href={`/${params.slug}/menu`}
              className="mt-6 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white"
            >
              Browse menu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <CartOutletHeader
              slug={params.slug}
              menuContext={menuContext}
            />

            <div className="space-y-3">
              {lines.map((line) => (
                <CartLineItem
                  key={line.key}
                  line={line}
                  menuContext={menuContext}
                  onUpdateQuantity={updateQuantity}
                  onUpdateNotes={updateLineNotes}
                />
              ))}
            </div>

            <CartBillSummary subtotal={subtotal} itemCount={itemCount} />
          </div>
        )}
      </div>

      {itemCount > 0 && (
        <CartStickyFooter
          href={`/${params.slug}/checkout`}
          label="Proceed to checkout"
          subtotal={subtotal}
        />
      )}
    </div>
  );
}
