"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Loader2, X } from "lucide-react";

import { isConsumerLoggedIn } from "@/lib/auth-store";
import {
  areOrderNotificationsEnabled,
  enableOrderNotifications,
  isPushPromptDismissedForSession,
  markPushPromptDismissedForSession,
  PUSH_BLOCKED_MESSAGE,
} from "@/lib/order-push";
import {
  getPushPermissionState,
  isPushSupported,
  isVapidConfigured,
  type PushPermissionState,
} from "@/lib/push-notifications";

export function PushNotificationPrompt() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [permission, setPermission] = useState<PushPermissionState>("default");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const evaluatePrompt = useCallback(async (options?: { ignoreDismiss?: boolean }) => {
    if (!isConsumerLoggedIn()) {
      setVisible(false);
      return;
    }

    if (!isPushSupported() || !isVapidConfigured()) {
      setVisible(false);
      return;
    }

    if (!options?.ignoreDismiss && isPushPromptDismissedForSession()) {
      setVisible(false);
      return;
    }

    const enabled = await areOrderNotificationsEnabled();
    if (enabled) {
      setVisible(false);
      return;
    }

    setPermission(getPushPermissionState());
    setMessage(null);
    setVisible(true);
  }, []);

  useEffect(() => {
    void evaluatePrompt();
  }, [evaluatePrompt, pathname]);

  useEffect(() => {
    function handleReturn() {
      if (document.visibilityState === "visible") {
        void evaluatePrompt({ ignoreDismiss: true });
      }
    }

    window.addEventListener("focus", handleReturn);
    document.addEventListener("visibilitychange", handleReturn);
    return () => {
      window.removeEventListener("focus", handleReturn);
      document.removeEventListener("visibilitychange", handleReturn);
    };
  }, [evaluatePrompt]);

  function dismiss() {
    markPushPromptDismissedForSession();
    setVisible(false);
  }

  async function handleEnable() {
    setLoading(true);
    setMessage(null);

    try {
      const result = await enableOrderNotifications();
      setPermission(getPushPermissionState());

      if (result.ok) {
        setVisible(false);
        return;
      }

      setMessage(result.message);
    } catch {
      setMessage("Could not enable notifications. Try again later.");
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  const blocked = permission === "denied";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-labelledby="push-prompt-title"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          aria-label="Not now"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10">
            <Bell className="h-5 w-5 text-brand" />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="push-prompt-title"
              className="text-base font-semibold text-stone-900"
            >
              Get live order updates
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              {blocked
                ? "Notifications are turned off for Salvafeast. Unblock them in your browser settings first, then enable alerts here."
                : "Know when your order is accepted, preparing, and ready — without refreshing."}
            </p>

            {blocked ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                {PUSH_BLOCKED_MESSAGE}
              </p>
            ) : null}

            {message && !blocked ? (
              <p className="mt-3 text-sm text-stone-600">{message}</p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleEnable()}
                disabled={loading}
                className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="inline h-4 w-4 animate-spin" />
                ) : blocked ? (
                  "Check again"
                ) : (
                  "Allow notifications"
                )}
              </button>
              <button
                type="button"
                onClick={dismiss}
                disabled={loading}
                className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 disabled:opacity-50"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
