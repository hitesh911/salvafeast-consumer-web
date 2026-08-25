import type { VerificationStatus } from "@/lib/api";

const POST_DRAFT_KEY = "salva_post_draft";

export type PostDraft = {
  embedUrl: string;
  outletId: string | null;
  outletSlug: string | null;
  outletName: string | null;
  outletVerificationStatus: VerificationStatus | null;
  menuItemId: string | null;
  menuItemName: string | null;
  caption: string;
};

export function savePostDraft(draft: PostDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(POST_DRAFT_KEY, JSON.stringify(draft));
}

export function loadPostDraft(): PostDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(POST_DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PostDraft;
  } catch {
    return null;
  }
}

export function clearPostDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(POST_DRAFT_KEY);
}

export const emptyPostDraft = (): PostDraft => ({
  embedUrl: "",
  outletId: null,
  outletSlug: null,
  outletName: null,
  outletVerificationStatus: null,
  menuItemId: null,
  menuItemName: null,
  caption: "",
});
