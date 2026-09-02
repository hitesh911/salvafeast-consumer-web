import { updatePushToken } from "@/lib/api";
import {
  clearStoredPushRegistration,
  getPushPermissionState,
  getStoredPushTokenFingerprint,
  isPushSupported,
  isVapidConfigured,
  markPushTokenRegistered,
  registerServiceWorker,
  serializePushSubscription,
  subscribeToPush,
} from "@/lib/push-notifications";

const PROMPT_DISMISS_KEY = "salva_push_prompt_dismissed";

export type EnableOrderPushResult =
  | { ok: true }
  | { ok: false; message: string; blocked?: boolean };

export const PUSH_BLOCKED_MESSAGE =
  "Notifications are blocked for Salvafeast in your browser. Open your browser or site settings, allow notifications for this site, then return here and tap Check again.";

export function markPushPromptDismissedForSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PROMPT_DISMISS_KEY, "1");
}

export function clearPushPromptDismissedForSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PROMPT_DISMISS_KEY);
}

export function isPushPromptDismissedForSession(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(PROMPT_DISMISS_KEY) === "1";
}

export async function areOrderNotificationsEnabled(): Promise<boolean> {
  if (!isPushSupported() || !isVapidConfigured()) return true;

  const permission = getPushPermissionState();
  if (permission !== "granted") return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return false;
    return Boolean(getStoredPushTokenFingerprint());
  } catch {
    return false;
  }
}

export async function enableOrderNotifications(): Promise<EnableOrderPushResult> {
  if (!isPushSupported()) {
    return { ok: false, message: "Notifications are not supported in this browser." };
  }

  if (!isVapidConfigured()) {
    return { ok: false, message: "Push is not configured on this environment yet." };
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission === "denied") {
    return { ok: false, message: PUSH_BLOCKED_MESSAGE, blocked: true };
  }

  if (permission !== "granted") {
    return { ok: false, message: "Permission was not granted." };
  }

  const registration = await registerServiceWorker();
  if (!registration) {
    return { ok: false, message: "Could not register the app for notifications." };
  }

  const subscription = await subscribeToPush(registration);
  if (!subscription) {
    return { ok: false, message: "Could not subscribe to push notifications." };
  }

  const token = serializePushSubscription(subscription);
  await updatePushToken(token);
  markPushTokenRegistered(token);
  clearPushPromptDismissedForSession();
  return { ok: true };
}

export async function disableOrderNotifications(): Promise<{
  ok: boolean;
  message?: string;
}> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    await subscription?.unsubscribe();
    clearStoredPushRegistration();
    clearPushPromptDismissedForSession();
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not turn off notifications." };
  }
}
