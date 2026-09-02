"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

import {
  areOrderNotificationsEnabled,
  disableOrderNotifications,
  enableOrderNotifications,
  PUSH_BLOCKED_MESSAGE,
} from "@/lib/order-push";
import {
  getPushPermissionState,
  isPushSupported,
  isVapidConfigured,
} from "@/lib/push-notifications";

export function PushNotificationsCard() {
  const [permission, setPermission] = useState(getPushPermissionState());
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const vapidConfigured = isVapidConfigured();

  const refreshState = useCallback(async () => {
    setPermission(getPushPermissionState());
    setEnabled(await areOrderNotificationsEnabled());
  }, []);

  useEffect(() => {
    void refreshState();
  }, [refreshState]);

  const enableNotifications = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await enableOrderNotifications();
      setPermission(getPushPermissionState());

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setEnabled(true);
      setMessage("Live order alerts enabled for this device.");
    } catch {
      setMessage("Could not enable notifications. Try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function disableNotifications() {
    setLoading(true);
    setMessage(null);
    try {
      const result = await disableOrderNotifications();
      if (!result.ok) {
        setMessage(result.message ?? "Could not turn off notifications.");
        return;
      }
      setEnabled(false);
      setMessage("Notifications turned off on this device.");
    } catch {
      setMessage("Could not turn off notifications.");
    } finally {
      setLoading(false);
    }
  }

  if (!isPushSupported()) {
    return null;
  }

  const blocked = permission === "denied";

  return (
    <section className="mb-6 rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-start gap-3">
        {enabled ? (
          <Bell className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
        ) : (
          <BellOff className="mt-0.5 h-5 w-5 shrink-0 text-stone-400" />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-medium text-stone-900">Order notifications</h2>
          <p className="mt-1 text-sm text-stone-500">
            Get live alerts when your order is accepted, preparing, ready, and
            more. Works best if you add Salvafeast to your home screen.
          </p>
          {!vapidConfigured ? (
            <p className="mt-2 text-xs text-amber-700">
              Push is not configured in this environment.
            </p>
          ) : null}
          {blocked && !enabled ? (
            <p className="mt-2 text-xs leading-relaxed text-amber-800">
              {PUSH_BLOCKED_MESSAGE}
            </p>
          ) : null}
          {message ? (
            <p className="mt-2 text-sm text-stone-600">{message}</p>
          ) : null}
          <div className="mt-3">
            {enabled ? (
              <button
                type="button"
                onClick={() => void disableNotifications()}
                disabled={loading}
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="inline h-4 w-4 animate-spin" />
                ) : (
                  "Turn off"
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void enableNotifications()}
                disabled={loading || !vapidConfigured}
                className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="inline h-4 w-4 animate-spin" />
                ) : blocked ? (
                  "Check again"
                ) : (
                  "Enable notifications"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
