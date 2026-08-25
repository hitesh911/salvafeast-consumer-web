"use client";

import { Search } from "lucide-react";

type MenuSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function MenuSearchBar({ value, onChange }: MenuSearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search menu..."
        className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      />
    </div>
  );
}
