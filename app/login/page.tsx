"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ConsumerShell } from "@/components/consumer-shell";
import { LegalFooterLinks } from "@/components/legal-footer-links";
import { requestConsumerOtp, verifyConsumerOtp } from "@/lib/api";
import { setConsumerTokens } from "@/lib/auth-store";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/account";

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
    <ConsumerShell hideNav>
      <div className="mx-auto max-w-lg px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-stone-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
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
        <h1 className="text-xl font-bold text-stone-900">Sign in</h1>
        <p className="mt-2 mb-6 text-sm text-stone-600">
          We&apos;ll send a 6-digit code on WhatsApp so you can place orders and
          view order history.
        </p>

        {step === "phone" ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              className="w-full rounded-lg border border-stone-300 px-3 py-2.5"
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-brand py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send WhatsApp code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {message ? (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                {message}
              </p>
            ) : null}
            <input
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code"
              className="w-full rounded-lg border border-stone-300 px-3 py-2.5"
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-brand py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
            </button>
          </form>
        )}
        <LegalFooterLinks className="mt-8" />
      </div>
    </ConsumerShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
