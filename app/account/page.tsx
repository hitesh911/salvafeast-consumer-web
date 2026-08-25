"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { isAxiosError } from "axios";
import { ConsumerShell } from "@/components/consumer-shell";
import { LegalFooterLinks } from "@/components/legal-footer-links";
import { PushNotificationsCard } from "@/components/push-notifications-card";
import {
  fetchMyOrders,
  fetchMyProfile,
  formatPrice,
  updateMyProfile,
  uploadMyAvatar,
  deleteMyAvatar,
  type ConsumerOrderSummary,
  type ConsumerUserProfile,
  type UserGender,
} from "@/lib/api";
import {
  ensureConsumerAccessToken,
  isConsumerLoggedIn,
  logoutConsumerSession,
} from "@/lib/auth-store";
import clsx from "clsx";

const LOGIN_RETURN = "/login?returnTo=%2Faccount";

const GENDERS: { value: UserGender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const DIETARY = [
  { value: "veg", label: "Veg" },
  { value: "vegan", label: "Vegan" },
  { value: "non_veg", label: "Non-veg" },
  { value: "jain", label: "Jain" },
  { value: "eggetarian", label: "Eggetarian" },
];

export default function AccountPage() {
  const [orders, setOrders] = useState<ConsumerOrderSummary[]>([]);
  const [profile, setProfile] = useState<ConsumerUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<UserGender | "">("");
  const [dietary, setDietary] = useState<string[]>([]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const loggedIn = isConsumerLoggedIn();

  useEffect(() => {
    async function load() {
      if (!isConsumerLoggedIn()) {
        window.location.replace(LOGIN_RETURN);
        return;
      }

      const ready = await ensureConsumerAccessToken();
      if (!ready) {
        window.location.replace(LOGIN_RETURN);
        return;
      }

      try {
        const [ordersData, profileData] = await Promise.all([
          fetchMyOrders(),
          fetchMyProfile(),
        ]);
        setOrders(ordersData);
        setProfile(profileData);
        setName(profileData.name ?? "");
        setEmail(profileData.email ?? "");
        setDob(profileData.date_of_birth ?? "");
        setGender(profileData.gender ?? "");
        setDietary(profileData.dietary_preferences ?? []);
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 401) {
          window.location.replace(LOGIN_RETURN);
          return;
        }
        setError("Could not load your account.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [loggedIn]);

  function handleSignOut() {
    void logoutConsumerSession().then(() => {
      window.location.href = "/login";
    });
  }

  async function handleSaveProfile() {
    if (!name.trim()) {
      setSaveMsg("Name is required.");
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await updateMyProfile({
        name: name.trim(),
        email: email.trim() || null,
        date_of_birth: dob.trim() || null,
        gender: gender || null,
        dietary_preferences: dietary,
      });
      setProfile(updated);
      setSaveMsg("Profile saved.");
    } catch {
      setSaveMsg("Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSaveMsg("Avatar must be 5 MB or smaller.");
      return;
    }
    setAvatarUploading(true);
    setSaveMsg(null);
    try {
      const updated = await uploadMyAvatar(file);
      setProfile(updated);
      setSaveMsg("Avatar uploaded.");
    } catch {
      setSaveMsg("Could not upload avatar.");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleAvatarRemove() {
    setAvatarUploading(true);
    setSaveMsg(null);
    try {
      const updated = await deleteMyAvatar();
      setProfile(updated);
      setSaveMsg("Avatar removed.");
    } catch {
      setSaveMsg("Could not remove avatar.");
    } finally {
      setAvatarUploading(false);
    }
  }

  if (!loggedIn || loading) {
    return (
      <ConsumerShell>
        <div className="flex min-h-[60dvh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </ConsumerShell>
    );
  }

  return (
    <ConsumerShell>
      <div className="mx-auto max-w-lg space-y-8 px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-900">Account</h1>
            <p className="text-sm text-stone-500">Profile and orders</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm text-stone-500 underline"
          >
            Sign out
          </button>
        </div>

        <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Profile
          </h2>
          <p className="text-xs text-stone-500">
            Phone {profile?.phone} · login identity
          </p>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-stone-100">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg font-semibold text-stone-400">
                  {(name || profile?.phone || "?").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700">
                Avatar
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={avatarUploading}
                  className="mt-1 block w-full text-xs text-stone-500 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-700"
                  onChange={(e) => {
                    void handleAvatarChange(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              {profile?.avatar_url ? (
                <button
                  type="button"
                  disabled={avatarUploading}
                  onClick={() => void handleAvatarRemove()}
                  className="text-xs text-stone-500 underline disabled:opacity-50"
                >
                  Remove avatar
                </button>
              ) : null}
            </div>
          </div>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-stone-700">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-stone-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-stone-700">Date of birth</span>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2"
            />
          </label>
          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-700">Gender</p>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(opt.value)}
                  className={clsx(
                    "rounded-lg border px-3 py-1.5 text-sm",
                    gender === opt.value
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-stone-200 text-stone-700",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-700">
              Dietary preferences
            </p>
            <div className="flex flex-wrap gap-2">
              {DIETARY.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setDietary((prev) =>
                      prev.includes(opt.value)
                        ? prev.filter((v) => v !== opt.value)
                        : [...prev, opt.value],
                    )
                  }
                  className={clsx(
                    "rounded-lg border px-3 py-1.5 text-sm",
                    dietary.includes(opt.value)
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-stone-200 text-stone-700",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {saveMsg ? (
            <p className="text-sm text-stone-600">{saveMsg}</p>
          ) : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSaveProfile()}
            className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </section>

        <PushNotificationsCard />

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            My orders
          </h2>
          {error ? (
            <p className="text-center text-sm text-red-600">{error}</p>
          ) : orders.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white py-16 text-center">
              <p className="text-sm text-stone-500">No orders yet.</p>
              <Link
                href="/"
                className="mt-4 inline-block text-sm font-medium text-brand"
              >
                Find a restaurant
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/${order.outlet_slug}/orders/${order.id}?from=account`}
                    className="block rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:border-brand/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-stone-900">
                          {order.outlet_name}
                        </p>
                        <p className="mt-1 text-xs capitalize text-stone-500">
                          {order.status.replace("_", " ")} ·{" "}
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-semibold text-brand">
                        {formatPrice(order.total_amount)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <LegalFooterLinks className="mt-8" />
      </div>
    </ConsumerShell>
  );
}
