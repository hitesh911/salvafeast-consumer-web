"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import type { PublicMenuResponse } from "@/lib/types";
import clsx from "clsx";

type CartOutletHeaderProps = {
  slug: string;
  menuContext: PublicMenuResponse | null;
  compact?: boolean;
};

export function CartOutletHeader({
  slug,
  menuContext,
  compact,
}: CartOutletHeaderProps) {
  const outlet = menuContext?.outlet;
  const tableNumber = menuContext?.ordering.scanned_table_number;

  if (!outlet) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <Link
          href={`/${slug}/menu`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand"
        >
          <Plus className="h-4 w-4" />
          Add more items
        </Link>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "rounded-xl border border-stone-200 bg-white shadow-sm",
        compact ? "p-3" : "p-4",
      )}
    >
      <div className="flex items-start gap-3">
        {outlet.logo_url ? (
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-stone-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={outlet.logo_url}
              alt={outlet.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
            {outlet.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-stone-900">{outlet.name}</p>
          {tableNumber ? (
            <p className="mt-0.5 text-sm text-stone-500">Table {tableNumber}</p>
          ) : (
            <p className="mt-0.5 text-sm text-stone-500">Your order</p>
          )}
        </div>
      </div>
      <Link
        href={`/${slug}/menu`}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand/90"
      >
        <Plus className="h-4 w-4" />
        Add more items
      </Link>
    </div>
  );
}
