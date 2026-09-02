const PUSH_TOKEN_KEY = "salva_push_token_registered";

function getVapidPublicKey(): string | null {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  return key || null;
}

export function isVapidConfigured(): boolean {
  return Boolean(getVapidPublicKey());
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export function serializePushSubscription(subscription: PushSubscription): string {
  return JSON.stringify(subscription.toJSON());
}

export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
): Promise<PushSubscription | null> {
  const vapidKey = getVapidPublicKey();
  if (!vapidKey) return null;

  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
  });
}

export function getStoredPushTokenFingerprint(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PUSH_TOKEN_KEY);
}

export function markPushTokenRegistered(token: string): void {
  localStorage.setItem(PUSH_TOKEN_KEY, token.slice(0, 120));
}

export function clearStoredPushRegistration(): void {
  localStorage.removeItem(PUSH_TOKEN_KEY);
}

export type PushPermissionState = NotificationPermission | "unsupported";

export function getPushPermissionState(): PushPermissionState {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}
