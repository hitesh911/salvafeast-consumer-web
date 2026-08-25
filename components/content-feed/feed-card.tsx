"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Heart,
  Loader2,
  MapPin,
  MoreHorizontal,
  UtensilsCrossed,
  X,
} from "lucide-react";
import clsx from "clsx";
import {
  reportContentPost,
  toggleContentPostLike,
  type ContentPostFeedItem,
} from "@/lib/api";
import { formatDistanceKm } from "@/lib/embed-utils";
import { InstagramEmbed } from "./instagram-embed";
import { YouTubeEmbed } from "./youtube-embed";

type FeedCardProps = {
  item: ContentPostFeedItem;
  onLikeChange: (postId: string, liked: boolean, likeCount: number) => void;
};

export function FeedCard({ item, onLikeChange }: FeedCardProps) {
  const [liked, setLiked] = useState(item.has_current_user_liked);
  const [likeCount, setLikeCount] = useState(item.like_count);
  const [likePending, setLikePending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportPending, setReportPending] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLiked(item.has_current_user_liked);
    setLikeCount(item.like_count);
  }, [item.has_current_user_liked, item.like_count]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const menuHref = item.menu_item
    ? `/${item.outlet.slug}/menu?item=${item.menu_item.id}`
    : `/${item.outlet.slug}/menu`;

  async function handleLike() {
    if (likePending) return;
    const nextLiked = !liked;
    const nextCount = likeCount + (nextLiked ? 1 : -1);
    setLiked(nextLiked);
    setLikeCount(Math.max(0, nextCount));
    setLikePending(true);
    try {
      const result = await toggleContentPostLike(item.id);
      setLiked(result.liked);
      setLikeCount(result.like_count);
      onLikeChange(item.id, result.liked, result.like_count);
    } catch {
      setLiked(liked);
      setLikeCount(likeCount);
    } finally {
      setLikePending(false);
    }
  }

  async function handleReport() {
    if (reportPending) return;
    setReportPending(true);
    try {
      await reportContentPost(item.id, reportReason.trim() || undefined);
      setReportDone(true);
      setReportOpen(false);
      setMenuOpen(false);
    } finally {
      setReportPending(false);
    }
  }

  return (
    <article className="relative flex h-[calc(100dvh-5rem)] snap-start snap-always flex-col overflow-hidden bg-stone-950">
      <div className="relative min-h-0 flex-1">
        {item.embed_platform === "instagram" ? (
          <InstagramEmbed url={item.embed_url} />
        ) : (
          <YouTubeEmbed url={item.embed_url} />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pb-4 pt-24">
          <div className="pointer-events-auto px-4">
            <div className="mb-3 flex items-center gap-2">
              {item.outlet.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.outlet.logo_url}
                  alt=""
                  className="h-9 w-9 rounded-full border border-white/20 object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
                  <UtensilsCrossed className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-white">
                    {item.outlet.name}
                  </span>
                  {item.outlet.verification_status === "verified" ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </span>
                  ) : null}
                </div>
                {item.menu_item ? (
                  <p className="truncate text-xs text-white/75">
                    {item.menu_item.name}
                  </p>
                ) : null}
                {item.distance_km != null ? (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-white/60">
                    <MapPin className="h-3 w-3" />
                    {formatDistanceKm(item.distance_km)}
                  </p>
                ) : null}
              </div>
            </div>

            {item.caption ? (
              <p className="mb-3 line-clamp-3 text-sm text-white/90">{item.caption}</p>
            ) : null}

            <div className="flex items-center gap-2">
              <Link
                href={menuHref}
                className="flex flex-1 items-center justify-center rounded-lg bg-brand py-2.5 text-sm font-semibold text-white active:scale-[0.98]"
              >
                Order from here
              </Link>
              <button
                type="button"
                onClick={handleLike}
                disabled={likePending}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15 text-white active:scale-95"
                aria-label={liked ? "Unlike" : "Like"}
              >
                <Heart
                  className={clsx(
                    "h-5 w-5",
                    liked ? "fill-red-500 text-red-500" : "text-white",
                  )}
                />
              </button>
              <span className="min-w-[1.5rem] text-sm font-medium text-white">
                {likeCount}
              </span>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15 text-white active:scale-95"
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
                {menuOpen ? (
                  <div className="absolute bottom-full right-0 mb-2 w-40 overflow-hidden rounded-lg border border-stone-700 bg-stone-900 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setReportOpen(true);
                        setMenuOpen(false);
                      }}
                      className="w-full px-3 py-2.5 text-left text-sm text-white hover:bg-white/10"
                    >
                      Report
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            {reportDone ? (
              <p className="mt-2 text-xs text-white/60">Thanks — we received your report.</p>
            ) : null}
          </div>
        </div>
      </div>

      {reportOpen ? (
        <div className="absolute inset-0 z-20 flex items-end bg-black/60">
          <div className="w-full rounded-t-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-stone-900">Report post</h3>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="rounded-lg p-1 text-stone-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              placeholder="Reason (optional)"
              rows={3}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={handleReport}
              disabled={reportPending}
              className="mt-3 flex w-full items-center justify-center rounded-lg bg-brand py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {reportPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Submit report"
              )}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
