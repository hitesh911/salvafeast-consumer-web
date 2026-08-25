"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/api";

type CartStickyFooterProps = {
  href: string;
  label: string;
  subtotal: number;
};

export function CartStickyFooter({ href, label, subtotal }: CartStickyFooterProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 safe-bottom">
      <div className="mx-auto max-w-lg px-4 pb-4">
        <Link
          href={href}
          className="block w-full rounded-2xl bg-brand py-3.5 text-center font-semibold text-white shadow-lg transition-transform active:scale-[0.98]"
        >
          {label} · {formatPrice(subtotal)}
        </Link>
      </div>
    </div>
  );
}
