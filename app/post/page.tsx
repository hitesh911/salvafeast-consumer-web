"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { isAxiosError } from "axios";
import { ConsumerShell } from "@/components/consumer-shell";
import {
  createContentPost,
  fetchMenu,
  fetchOutlets,
  type PublicOutletSummary,
  type VerificationStatus,
} from "@/lib/api";
import { ensureConsumerAccessToken, isConsumerLoggedIn } from "@/lib/auth-store";
import {
  clearPostDraft,
  emptyPostDraft,
  loadPostDraft,
  savePostDraft,
  type PostDraft,
} from "@/lib/post-draft";
import type { PublicMenuItem } from "@/lib/types";

function PostPageContent() {
  const router = useRouter();
  const [draft, setDraft] = useState<PostDraft>(emptyPostDraft);
  const [outletQuery, setOutletQuery] = useState("");
  const [outletResults, setOutletResults] = useState<PublicOutletSummary[]>([]);
  const [outletLoading, setOutletLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<PublicMenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<VerificationStatus | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = loadPostDraft();
    if (saved) setDraft(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    savePostDraft(draft);
  }, [draft, ready]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!outletQuery.trim()) {
        setOutletResults([]);
        return;
      }
      setOutletLoading(true);
      fetchOutlets(outletQuery.trim())
        .then((data) => setOutletResults(data.items))
        .catch(() => setOutletResults([]))
        .finally(() => setOutletLoading(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [outletQuery]);

  useEffect(() => {
    if (!draft.outletSlug) {
      setMenuItems([]);
      return;
    }
    setMenuLoading(true);
    fetchMenu(draft.outletSlug)
      .then((data) => {
        const items = data.menu.flatMap((category) => category.items);
        setMenuItems(items);
      })
      .catch(() => setMenuItems([]))
      .finally(() => setMenuLoading(false));
  }, [draft.outletSlug]);

  const canSubmit = useMemo(
    () => draft.embedUrl.trim() && draft.outletId,
    [draft.embedUrl, draft.outletId],
  );

  function selectOutlet(outlet: PublicOutletSummary) {
    setDraft((prev) => ({
      ...prev,
      outletId: outlet.id,
      outletSlug: outlet.slug,
      outletName: outlet.name,
      outletVerificationStatus: outlet.verification_status,
      menuItemId: null,
      menuItemName: null,
    }));
    setOutletQuery(outlet.name);
    setOutletResults([]);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || !draft.outletId) return;

    if (!isConsumerLoggedIn()) {
      savePostDraft(draft);
      router.push(`/login?returnTo=${encodeURIComponent("/post")}`);
      return;
    }

    const tokenReady = await ensureConsumerAccessToken();
    if (!tokenReady) {
      savePostDraft(draft);
      router.push(`/login?returnTo=${encodeURIComponent("/post")}`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await createContentPost({
        outlet_id: draft.outletId,
        menu_item_id: draft.menuItemId ?? undefined,
        embed_url: draft.embedUrl.trim(),
        caption: draft.caption.trim() || undefined,
      });
      clearPostDraft();
      setDraft(emptyPostDraft());
      setOutletQuery("");
      setSubmitSuccess(result.outlet_verification_status);
    } catch (err) {
      if (isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === "string" ? detail : "Could not create post.");
      } else {
        setError("Could not create post.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (submitSuccess) {
    const pendingMessage =
      submitSuccess === "pending"
        ? "This restaurant is still awaiting verification. Your post is saved and will appear in the feed once the outlet is verified."
        : submitSuccess === "rejected"
          ? "This restaurant isn't eligible for the public feed right now. Your post was saved but won't be shown until verification status changes."
          : "Your post is live in the feed.";

    return (
      <main className="mx-auto max-w-lg px-4 py-6">
        <h1 className="text-2xl font-bold text-stone-900">Post shared</h1>
        <p className="mt-3 text-sm text-stone-600">{pendingMessage}</p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/"
            className="flex items-center justify-center rounded-xl bg-brand py-3 text-sm font-semibold text-white"
          >
            Back to feed
          </Link>
          <button
            type="button"
            onClick={() => setSubmitSuccess(null)}
            className="rounded-xl border border-stone-200 py-3 text-sm font-medium text-stone-700"
          >
            Share another post
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-bold text-stone-900">Share a post</h1>
      <p className="mt-2 mb-6 text-sm text-stone-500">
        Paste an Instagram or YouTube link from a restaurant you visited.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">
            Link
          </label>
          <input
            type="url"
            required
            value={draft.embedUrl}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, embedUrl: event.target.value }))
            }
            placeholder="https://instagram.com/p/... or youtube.com/watch?v=..."
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">
            Restaurant
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={outletQuery}
              onChange={(event) => {
                setOutletQuery(event.target.value);
                if (draft.outletName && event.target.value !== draft.outletName) {
                  setDraft((prev) => ({
                    ...prev,
                    outletId: null,
                    outletSlug: null,
                    outletName: null,
                    outletVerificationStatus: null,
                    menuItemId: null,
                    menuItemName: null,
                  }));
                }
              }}
              placeholder="Search restaurants..."
              className="w-full rounded-xl border border-stone-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand"
            />
          </div>
          {outletLoading ? (
            <p className="mt-2 text-xs text-stone-500">Searching...</p>
          ) : null}
          {outletResults.length > 0 ? (
            <ul className="mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white">
              {outletResults.map((outlet) => (
                <li key={outlet.id}>
                  <button
                    type="button"
                    onClick={() => selectOutlet(outlet)}
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-stone-50"
                  >
                    {outlet.name}
                    {outlet.address ? (
                      <span className="block text-xs text-stone-500">
                        {outlet.address}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {draft.outletName ? (
            <p className="mt-2 text-xs text-brand">Selected: {draft.outletName}</p>
          ) : null}
          {draft.outletVerificationStatus &&
          draft.outletVerificationStatus !== "verified" ? (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-stone-600">
              This outlet hasn&apos;t been verified yet — your post will be saved but
              won&apos;t appear in the feed until it is.
            </p>
          ) : null}
        </div>

        {draft.outletSlug ? (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              Tagged dish (optional)
            </label>
            {menuLoading ? (
              <p className="text-xs text-stone-500">Loading menu...</p>
            ) : (
              <select
                value={draft.menuItemId ?? ""}
                onChange={(event) => {
                  const selected = menuItems.find((item) => item.id === event.target.value);
                  setDraft((prev) => ({
                    ...prev,
                    menuItemId: selected?.id ?? null,
                    menuItemName: selected?.name ?? null,
                  }));
                }}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
              >
                <option value="">None</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : null}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">
            Caption (optional)
          </label>
          <textarea
            value={draft.caption}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, caption: event.target.value }))
            }
            rows={3}
            placeholder="What did you love about this?"
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="flex w-full items-center justify-center rounded-xl bg-brand py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
        </button>
      </form>
    </main>
  );
}

export default function PostPage() {
  return (
    <ConsumerShell>
      <Suspense
        fallback={
          <div className="flex min-h-[50dvh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        }
      >
        <PostPageContent />
      </Suspense>
    </ConsumerShell>
  );
}
