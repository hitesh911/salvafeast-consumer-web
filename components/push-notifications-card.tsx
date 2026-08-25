"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

import { updatePushToken } from "@/lib/api";
import {
  clearStoredPushRegistration,
  getPushPermissionState,
  getStoredPushTokenFingerprint,
  isPushSupported,
  markPushTokenRegistered,
  registerServiceWorker,
  serializePushSubscription,
  subscribeToPush,
} from "@/lib/push-notifications";

export function PushNotificationsCard() {
  const [permission, setPermission] = useState(getPushPermissionState());
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [vapidConfigured, setVapidConfigured] = useState(true);

  useEffect(() => {
    setPermission(getPushPermissionState());
    setEnabled(Boolean(getStoredPushTokenFingerprint()));
    setVapidConfigured(Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()));
  }, []);

  const enableNotifications = useCallback(async () => {
    if (!isPushSupported()) {
      setMessage("Notifications are not supported in this browser.");
      return;
    }

    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()) {
      setMessage("Push is not configured on this environment yet.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        setMessage("Permission denied. Enable notifications in browser settings.");
        return;
      }

      const registration = await registerServiceWorker();
      if (!registration) {
        setMessage("Could not register the app for notifications.");
        return;
      }

      const subscription = await subscribeToPush(registration);
      if (!subscription) {
        setMessage("Could not subscribe to push notifications.");
        return;
      }

      const token = serializePushSubscription(subscription);
      await updatePushToken(token);
      markPushTokenRegistered(token);
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
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      await subscription?.unsubscribe();
      clearStoredPushRegistration();
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
                disabled={loading || permission === "denied" || !vapidConfigured}
                className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="inline h-4 w-4 animate-spin" />
                ) : permission === "denied" ? (
                  "Blocked in browser"
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
