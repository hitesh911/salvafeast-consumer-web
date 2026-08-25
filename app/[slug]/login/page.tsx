"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { requestConsumerOtp, verifyConsumerOtp } from "@/lib/api";
import { setConsumerTokens } from "@/lib/auth-store";

function LoginPageContent({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? `/${params.slug}`;

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await requestConsumerOtp(phone.trim());
      setMessage(result.message);
      setStep("otp");
    } catch {
      setError("Could not send OTP. Check your phone number.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await verifyConsumerOtp(phone.trim(), otp.trim());
      setConsumerTokens(result.access_token, result.refresh_token);
      router.push(returnTo);
    } catch {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link
            href={`/${params.slug}`}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold text-stone-900">Sign in</h1>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-5 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/salvafeast-logo.png"
            alt="Salvafeast"
            className="h-10 w-10 object-contain"
          />
          <div>
            <p className="text-lg font-bold text-stone-900">Salvafeast</p>
            <p className="text-xs text-stone-500">Acha khana.</p>
          </div>
        </div>
        <p className="mb-6 text-sm text-stone-600">
          We&apos;ll send a 6-digit code on WhatsApp so you can place orders and
          view your order history.
        </p>

        {step === "phone" ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900"
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send WhatsApp code
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {message ? (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                {message}
              </p>
            ) : null}
            <div>
              <label htmlFor="otp" className="mb-1.5 block text-sm font-medium">
                OTP code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900"
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Verify & continue
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError(null);
              }}
              className="w-full text-sm text-stone-500 underline"
            >
              Use a different number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      }
    >
      <LoginPageContent params={params} />
    </Suspense>
  );
}
