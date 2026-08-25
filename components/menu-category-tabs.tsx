"use client";

import clsx from "clsx";
import type { PublicMenuCategory } from "@/lib/types";

type MenuCategoryTabsProps = {
  categories: PublicMenuCategory[];
  activeId: string | null;
  onSelect: (categoryId: string) => void;
};

export function MenuCategoryTabs({
  categories,
  activeId,
  onSelect,
}: MenuCategoryTabsProps) {
  if (categories.length <= 1) return null;

  return (
    <div className="sticky top-[57px] z-30 -mx-4 border-b border-stone-200 bg-white/95 px-4 py-2 backdrop-blur-sm">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={clsx(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeId === category.id
                ? "bg-brand text-white"
                : "bg-stone-100 text-stone-600",
            )}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
