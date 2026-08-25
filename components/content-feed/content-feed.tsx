"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { isAxiosError } from "axios";
import {
  fetchContentFeed,
  type ContentPostFeedItem,
} from "@/lib/api";
import { ensureConsumerAccessToken, isConsumerLoggedIn } from "@/lib/auth-store";
import { FeedCard } from "./feed-card";
import { InstagramEmbedScript } from "./instagram-embed";

const LOGIN_RETURN = "/login?returnTo=%2F";
const PAGE_SIZE = 10;

type LocationMode =
  | { kind: "geo"; lat: number; lng: number }
  | { kind: "city"; city: string }
  | { kind: "fallback" };

export function ContentFeed() {
  const [items, setItems] = useState<ContentPostFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [locationMode, setLocationMode] = useState<LocationMode | null>(null);
  const [cityInput, setCityInput] = useState("");
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  const hasMore = items.length < total;

  const fetchPage = useCallback(
    async (pageNum: number, mode: LocationMode, append: boolean) => {
      const params: Parameters<typeof fetchContentFeed>[0] = {
        page: pageNum,
        page_size: PAGE_SIZE,
      };
      if (mode.kind === "geo") {
        params.lat = mode.lat;
        params.lng = mode.lng;
      } else if (mode.kind === "city") {
        params.city_search = mode.city;
      }

      const data = await fetchContentFeed(params);
      setTotal(data.total);
      setPage(data.page);
      setItems((prev) => (append ? [...prev, ...data.items] : data.items));
    },
    [],
  );

  useEffect(() => {
    async function init() {
      if (!isConsumerLoggedIn()) {
        window.location.replace(LOGIN_RETURN);
        return;
      }
      const ready = await ensureConsumerAccessToken();
      if (!ready) {
        window.location.replace(LOGIN_RETURN);
        return;
      }
      setAuthReady(true);

      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const mode: LocationMode = {
              kind: "geo",
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setLocationMode(mode);
            try {
              await fetchPage(1, mode, false);
            } catch (err) {
              if (isAxiosError(err) && err.response?.status === 401) {
                window.location.replace(LOGIN_RETURN);
                return;
              }
              setError("Could not load feed.");
            } finally {
              setLoading(false);
            }
          },
          () => {
            setShowCitySearch(true);
            setLocationMode({ kind: "fallback" });
            fetchPage(1, { kind: "fallback" }, false)
              .catch(() => setError("Could not load feed."))
              .finally(() => setLoading(false));
          },
          { enableHighAccuracy: false, timeout: 8000 },
        );
      } else {
        setShowCitySearch(true);
        setLocationMode({ kind: "fallback" });
        try {
          await fetchPage(1, { kind: "fallback" }, false);
        } catch {
          setError("Could not load feed.");
        } finally {
          setLoading(false);
        }
      }
    }

    init();
  }, [fetchPage]);

  useEffect(() => {
    if (!locationMode || loading || !hasMore) return;

    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || loadingMoreRef.current || !locationMode) {
          return;
        }
        loadingMoreRef.current = true;
        setLoadingMore(true);
        fetchPage(page + 1, locationMode, true)
          .catch(() => {
            /* keep existing items */
          })
          .finally(() => {
            loadingMoreRef.current = false;
            setLoadingMore(false);
          });
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchPage, hasMore, loading, locationMode, page]);

  async function handleCitySearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    const city = cityInput.trim();
    if (!city) return;
    setLoading(true);
    setError(null);
    const mode: LocationMode = { kind: "city", city };
    setLocationMode(mode);
    setShowCitySearch(false);
    try {
      await fetchPage(1, mode, false);
    } catch {
      setError("Could not load feed for that location.");
    } finally {
      setLoading(false);
    }
  }

  function handleLikeChange(postId: string, liked: boolean, likeCount: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === postId
          ? { ...item, has_current_user_liked: liked, like_count: likeCount }
          : item,
      ),
    );
  }

  if (!authReady || loading) {
    return (
      <div className="flex h-[calc(100dvh-5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <>
      <InstagramEmbedScript />

      {showCitySearch ? (
        <div className="border-b border-stone-200 bg-white px-4 pb-3 pt-14">
          <form onSubmit={handleCitySearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={cityInput}
              onChange={(event) => setCityInput(event.target.value)}
              placeholder="Explore food in..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand"
            />
          </form>
          <p className="mt-2 flex items-center gap-1 text-xs text-stone-500">
            <MapPin className="h-3 w-3" />
            Location unavailable — search by city or browse latest posts
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="flex h-[calc(100dvh-5rem)] flex-col items-center justify-center px-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-[calc(100dvh-5rem)] flex-col items-center justify-center px-6 text-center">
          <p className="font-medium text-stone-800">No posts yet</p>
          <p className="mt-2 text-sm text-stone-500">
            Be the first to share food from a restaurant you love.
          </p>
        </div>
      ) : (
        <div className="feed-scroll h-[calc(100dvh-5rem)] snap-y snap-mandatory overflow-y-auto overscroll-y-contain">
          {items.map((item) => (
            <FeedCard key={item.id} item={item} onLikeChange={handleLikeChange} />
          ))}
          <div ref={sentinelRef} className="flex h-16 items-center justify-center">
            {loadingMore ? (
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
