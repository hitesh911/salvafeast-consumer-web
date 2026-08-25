"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import clsx from "clsx";
import { fetchMenu } from "@/lib/api";
import { useCart } from "@/lib/cart-store";
import type { DietaryType, PublicMenuItem, PublicMenuResponse } from "@/lib/types";
import { MenuItemCard } from "@/components/menu-item-card";
import { CartBar } from "@/components/cart-bar";
import { MenuSearchBar } from "@/components/menu-search-bar";
import { MenuCategoryTabs } from "@/components/menu-category-tabs";
import { MenuItemSheet } from "@/components/menu-item-sheet";

type DietaryFilter = "all" | DietaryType;

function MenuPageContent({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams();
  const tableToken = searchParams.get("t");
  const highlightItemId = searchParams.get("item");
  const { setMenuContext, setTableToken } = useCart();

  const [menu, setMenu] = useState<PublicMenuResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilter>("all");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [sheetItem, setSheetItem] = useState<PublicMenuItem | null>(null);
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    setTableToken(tableToken);
  }, [tableToken, setTableToken]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMenu(params.slug, tableToken)
      .then((data) => {
        if (cancelled) return;
        setMenu(data);
        setMenuContext(data);
        const first = data.menu.find((c) => c.items.length > 0);
        if (first) setActiveCategoryId(first.id);
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err?.response?.data?.detail ?? "Could not load menu. Please try again.";
        setError(typeof message === "string" ? message : "Something went wrong");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.slug, tableToken, setMenuContext]);

  useEffect(() => {
    if (!menu || !highlightItemId) return;
    for (const category of menu.menu) {
      const item = category.items.find((entry) => entry.id === highlightItemId);
      if (!item) continue;
      setActiveCategoryId(category.id);
      requestAnimationFrame(() => {
        categoryRefs.current[category.id]?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        const node = document.getElementById(`item-${item.id}`);
        node?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      break;
    }
  }, [menu, highlightItemId]);

  const visibleCategories = useMemo(() => {
    if (!menu) return [];
    const term = search.trim().toLowerCase();
    return menu.menu
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          const matchesSearch =
            !term ||
            item.name.toLowerCase().includes(term) ||
            (item.description?.toLowerCase().includes(term) ?? false);
          const matchesDietary =
            dietaryFilter === "all" || item.dietary_type === dietaryFilter;
          return matchesSearch && matchesDietary;
        }),
      }))
      .filter((category) => category.items.length > 0);
  }, [menu, search, dietaryFilter]);

  function scrollToCategory(categoryId: string) {
    setActiveCategoryId(categoryId);
    categoryRefs.current[categoryId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-medium text-stone-800">Menu unavailable</p>
        <p className="mt-2 text-sm text-stone-500">{error}</p>
      </div>
    );
  }

  const { outlet, ordering } = menu;

  return (
    <div className="min-h-dvh pb-28">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
        <div className="px-4 py-3">
          <div className="mb-3 flex items-center gap-3">
            <Link
              href={`/${params.slug}`}
              className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            {outlet.logo_url ? (
              <div className="h-10 w-10 overflow-hidden rounded-lg border border-stone-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={outlet.logo_url}
                  alt={outlet.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold text-stone-900">
                {outlet.name}
              </h1>
              {ordering.scanned_table_number ? (
                <p className="text-xs text-stone-500">
                  Table {ordering.scanned_table_number}
                </p>
              ) : null}
            </div>
          </div>
          <MenuSearchBar value={search} onChange={setSearch} />
          <div className="mt-3 flex gap-2">
            {(["all", "veg", "non_veg"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setDietaryFilter(filter)}
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-medium capitalize",
                  dietaryFilter === filter
                    ? "bg-brand text-white"
                    : "bg-stone-100 text-stone-600",
                )}
              >
                {filter === "all" ? "All" : filter.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
        <MenuCategoryTabs
          categories={visibleCategories}
          activeId={activeCategoryId}
          onSelect={scrollToCategory}
        />
      </header>

      <div className="mx-auto max-w-lg px-4 py-4">
        {visibleCategories.length === 0 ? (
          <p className="py-12 text-center text-stone-500">
            No items match your search.
          </p>
        ) : (
          visibleCategories.map((category) => (
            <section
              key={category.id}
              id={`category-${category.id}`}
              ref={(node) => {
                categoryRefs.current[category.id] = node;
              }}
              className="mb-6 scroll-mt-36"
            >
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
                {category.name}
              </h2>
              <div className="space-y-3">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    id={`item-${item.id}`}
                    className={clsx(
                      highlightItemId === item.id &&
                        "rounded-xl ring-2 ring-brand ring-offset-2",
                    )}
                  >
                    <MenuItemCard
                      item={item}
                      onOpenDetail={() => setSheetItem(item)}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <CartBar slug={params.slug} />
      <MenuItemSheet item={sheetItem} onClose={() => setSheetItem(null)} />
    </div>
  );
}

export default function MenuPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      }
    >
      <MenuPageContent params={params} />
    </Suspense>
  );
}
