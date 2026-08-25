import axios, { isAxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  clearConsumerToken,
  ensureConsumerAccessToken,
  getConsumerToken,
} from "./auth-store";
import type {
  OrderDetailResponse,
  OrderPlacementRequest,
  OrderPlacementResponse,
  PublicMenuResponse,
  PublicOrderStatusResponse,
} from "./types";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: `${baseURL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise: Promise<boolean> | null = null;

async function refreshConsumerSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = ensureConsumerAccessToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

api.interceptors.request.use(async (config) => {
  await ensureConsumerAccessToken();
  const token = getConsumerToken();
  if (token && isConsumerAccessValid(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    const headers = config.headers;
    if (headers && typeof headers.delete === "function") {
      headers.delete("Content-Type");
    } else if (headers) {
      delete (headers as Record<string, unknown>)["Content-Type"];
    }
  }
  return config;
});

function isConsumerAccessValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as {
      exp?: number;
      user_type?: string;
    };
    if (payload.user_type !== "user") return false;
    if (!payload.exp) return true;
    return Date.now() < payload.exp * 1000;
  } catch {
    return false;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      isAxiosError(error) &&
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      original.headers?.Authorization &&
      !String(original.url ?? "").includes("/auth/refresh")
    ) {
      original._retry = true;
      const refreshed = await refreshConsumerSession();
      if (refreshed) {
        const token = getConsumerToken();
        if (token) {
          original.headers.Authorization = `Bearer ${token}`;
        }
        return api(original);
      }

      clearConsumerToken();
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        const returnTo = encodeURIComponent(path + window.location.search);
        if (!path.startsWith("/login")) {
          window.location.replace(`/login?returnTo=${returnTo}`);
        }
      }
    }

    return Promise.reject(error);
  },
);

function authHeaders(): Record<string, string> {
  const token = getConsumerToken();
  return token && isConsumerAccessValid(token)
    ? { Authorization: `Bearer ${token}` }
    : {};
}

export interface PublicOutletSummary {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  cover_image_url: string | null;
  address: string | null;
  city?: string | null;
  area?: string | null;
  cuisine_tags: string[];
  cost_for_two?: number | null;
  is_pure_veg?: boolean;
  verification_status: VerificationStatus;
}

export interface PublicOutletInfo extends PublicOutletSummary {
  phone: string | null;
  description: string | null;
  opening_hours: Record<string, unknown> | null;
  address_line1?: string | null;
  address_line2?: string | null;
  landmark?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  outlet_type?: string | null;
}

export interface PublicOfferSummary {
  id: string;
  title: string;
  description: string | null;
  offer_code: string;
  discount_type: string;
  discount_value: string;
}

export interface PublicOutletDetail {
  outlet: PublicOutletInfo;
  active_offers: PublicOfferSummary[];
}

export async function fetchOutlets(query?: string): Promise<{
  items: PublicOutletSummary[];
  total: number;
}> {
  const params = query?.trim() ? { q: query.trim() } : undefined;
  const { data } = await api.get<{ items: PublicOutletSummary[]; total: number }>(
    "/public/outlets",
    { params },
  );
  return data;
}

export async function fetchOutlet(slug: string): Promise<PublicOutletDetail> {
  const { data } = await api.get<PublicOutletDetail>(`/public/outlets/${slug}`);
  return data;
}

export async function fetchOutletOffers(slug: string): Promise<PublicOfferSummary[]> {
  const { data } = await api.get<PublicOfferSummary[]>(
    `/public/outlets/${slug}/offers`,
  );
  return data;
}

export async function fetchMenu(
  slug: string,
  tableToken?: string | null,
): Promise<PublicMenuResponse> {
  const params = tableToken ? { t: tableToken } : undefined;
  const { data } = await api.get<PublicMenuResponse>(
    `/public/outlets/${slug}/menu`,
    { params },
  );
  return data;
}

export async function placeOrder(
  slug: string,
  payload: OrderPlacementRequest,
): Promise<OrderPlacementResponse> {
  const { data } = await api.post<OrderPlacementResponse>(
    `/public/outlets/${slug}/orders`,
    payload,
    { headers: authHeaders() },
  );
  return data;
}

export async function fetchOrderStatus(
  slug: string,
  orderId: string,
  token: string,
): Promise<PublicOrderStatusResponse> {
  const { data } = await api.get<PublicOrderStatusResponse>(
    `/public/outlets/${slug}/orders/${orderId}`,
    { params: { token } },
  );
  return data;
}

export async function cancelOrder(
  slug: string,
  orderId: string,
  token?: string | null,
): Promise<PublicOrderStatusResponse> {
  const { data } = await api.post<PublicOrderStatusResponse>(
    `/public/outlets/${slug}/orders/${orderId}/cancel`,
    null,
    {
      params: token ? { token } : undefined,
      headers: authHeaders(),
    },
  );
  return data;
}

export async function requestCancelOrder(
  slug: string,
  orderId: string,
  token?: string | null,
): Promise<PublicOrderStatusResponse> {
  const { data } = await api.post<PublicOrderStatusResponse>(
    `/public/outlets/${slug}/orders/${orderId}/cancel-request`,
    null,
    {
      params: token ? { token } : undefined,
      headers: authHeaders(),
    },
  );
  return data;
}

export async function requestConsumerOtp(phone: string): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/auth/otp/request", {
    phone,
  });
  return data;
}

export async function verifyConsumerOtp(
  phone: string,
  otpCode: string,
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const { data } = await api.post<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>("/auth/otp/verify", { phone, otp_code: otpCode });
  return data;
}

export interface ConsumerOrderSummary {
  id: string;
  outlet_id: string;
  outlet_slug: string;
  outlet_name: string;
  outlet_logo_url: string | null;
  order_type: string;
  status: string;
  subtotal_amount: string;
  discount_amount: string;
  total_amount: string;
  payment_status: string;
  created_at: string;
}

export interface ConsumerOrderDetail {
  order: OrderDetailResponse;
  outlet_slug: string;
  tracking_token: string;
}

export async function fetchMyOrders(): Promise<ConsumerOrderSummary[]> {
  const { data } = await api.get<ConsumerOrderSummary[]>(
    "/public/users/me/orders",
    { headers: authHeaders() },
  );
  return data;
}

export type UserGender =
  | "male"
  | "female"
  | "other"
  | "prefer_not_to_say";

export interface ConsumerUserProfile {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: UserGender | null;
  dietary_preferences: string[];
  profile_completed_at: string | null;
}

export type ConsumerUserProfileUpdate = {
  name?: string;
  email?: string | null;
  date_of_birth?: string | null;
  gender?: UserGender | null;
  dietary_preferences?: string[];
};

export async function fetchMyProfile(): Promise<ConsumerUserProfile> {
  const { data } = await api.get<ConsumerUserProfile>("/public/users/me", {
    headers: authHeaders(),
  });
  return data;
}

export async function updateMyProfile(
  payload: ConsumerUserProfileUpdate,
): Promise<ConsumerUserProfile> {
  const { data } = await api.patch<ConsumerUserProfile>(
    "/public/users/me",
    payload,
    { headers: authHeaders() },
  );
  return data;
}

export async function uploadMyAvatar(file: File): Promise<ConsumerUserProfile> {
  const form = new FormData();
  form.append("avatar", file);
  const { data } = await api.post<ConsumerUserProfile>(
    "/public/users/me/avatar",
    form,
    { headers: authHeaders() },
  );
  return data;
}

export async function deleteMyAvatar(): Promise<ConsumerUserProfile> {
  const { data } = await api.delete<ConsumerUserProfile>(
    "/public/users/me/avatar",
    { headers: authHeaders() },
  );
  return data;
}

export async function updatePushToken(pushToken: string): Promise<void> {
  await api.patch(
    "/public/users/me/push-token",
    { push_token: pushToken },
    { headers: authHeaders() },
  );
}

export async function fetchMyOrderDetail(
  orderId: string,
): Promise<ConsumerOrderDetail> {
  const { data } = await api.get<ConsumerOrderDetail>(
    `/public/users/me/orders/${orderId}`,
    { headers: authHeaders() },
  );
  return data;
}

export function formatPrice(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/** Signed variant adjustment: +₹30 / −₹40 / empty when zero. */
export function formatPriceDelta(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!Number.isFinite(num) || num === 0) return "";
  const formatted = formatPrice(Math.abs(num));
  return num > 0 ? `+${formatted}` : `−${formatted}`;
}

export function calcItemUnitPrice(
  basePrice: string,
  variantDelta?: string,
  addonPrices: string[] = [],
): number {
  const base = parseFloat(basePrice);
  const delta = variantDelta ? parseFloat(variantDelta) : 0;
  const addons = addonPrices.reduce((sum, p) => sum + parseFloat(p), 0);
  return base + delta + addons;
}

export type EmbedPlatform = "instagram" | "youtube";

export type VerificationStatus = "pending" | "verified" | "rejected";

export interface ContentPostOutletSummary {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  verification_status: VerificationStatus;
}

export interface ContentPostMenuItemSummary {
  id: string;
  name: string;
  base_price: string;
}

export interface ContentPostFeedItem {
  id: string;
  created_by_user_id: string;
  embed_url: string;
  embed_platform: EmbedPlatform;
  caption: string | null;
  like_count: number;
  created_at: string;
  outlet: ContentPostOutletSummary;
  menu_item: ContentPostMenuItemSummary | null;
  distance_km: number | null;
  has_current_user_liked: boolean;
}

export interface PaginatedContentPostFeed {
  items: ContentPostFeedItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface ContentPostLikeResponse {
  liked: boolean;
  like_count: number;
}

export interface ContentPostResponse {
  id: string;
  outlet_verification_status: VerificationStatus;
}

export async function fetchContentFeed(params: {
  lat?: number;
  lng?: number;
  city_search?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedContentPostFeed> {
  const { data } = await api.get<PaginatedContentPostFeed>(
    "/public/content-posts/feed",
    { params, headers: authHeaders() },
  );
  return data;
}

export async function createContentPost(payload: {
  outlet_id: string;
  menu_item_id?: string;
  embed_url: string;
  caption?: string;
}): Promise<ContentPostResponse> {
  const { data } = await api.post<ContentPostResponse>(
    "/public/content-posts",
    payload,
    { headers: authHeaders() },
  );
  return data;
}

export async function toggleContentPostLike(
  postId: string,
): Promise<ContentPostLikeResponse> {
  const { data } = await api.post<ContentPostLikeResponse>(
    `/public/content-posts/${postId}/like`,
    {},
    { headers: authHeaders() },
  );
  return data;
}

export async function reportContentPost(
  postId: string,
  reason?: string,
): Promise<void> {
  await api.post(
    `/public/content-posts/${postId}/report`,
    { reason: reason ?? null },
    { headers: authHeaders() },
  );
}
