"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, UtensilsCrossed } from "lucide-react";
import { ConsumerShell } from "@/components/consumer-shell";
import { OutletCard } from "@/components/outlet-card";
import { fetchOutlets } from "@/lib/api";

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outlets, setOutlets] = useState<Awaited<ReturnType<typeof fetchOutlets>>["items"]>(
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchOutlets(debouncedQuery)
      .then((data) => {
        if (cancelled) return;
        setOutlets(data.items);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Could not load restaurants. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const emptyMessage = useMemo(() => {
    if (debouncedQuery.trim()) {
      return `No restaurants found for "${debouncedQuery.trim()}"`;
    }
    return "No restaurants available yet";
  }, [debouncedQuery]);

  return (
    <ConsumerShell>
      <main className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Explore</h1>
              <p className="text-sm text-stone-500">
                Browse restaurants and order from your table
              </p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search restaurants..."
              className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : error ? (
          <p className="py-12 text-center text-sm text-red-600">{error}</p>
        ) : outlets.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white py-16 text-center">
            <p className="text-stone-500">{emptyMessage}</p>
            <p className="mt-2 text-xs text-stone-400">
              You can also scan a table QR code to order directly
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {outlets.map((outlet) => (
              <OutletCard key={outlet.slug} outlet={outlet} />
            ))}
          </div>
        )}
      </main>
    </ConsumerShell>
  );
}
