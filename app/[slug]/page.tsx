"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Tag } from "lucide-react";
import { ConsumerShell } from "@/components/consumer-shell";
import { OutletHero } from "@/components/outlet-hero";
import { fetchOutlet, type PublicOfferSummary } from "@/lib/api";
import type { PublicOutletInfo } from "@/lib/types";

function QrRedirect({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableToken = searchParams.get("t");

  useEffect(() => {
    if (tableToken) {
      router.replace(`/${slug}/menu?t=${encodeURIComponent(tableToken)}`);
    }
  }, [router, slug, tableToken]);

  if (tableToken) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return null;
}

function OutletLanding({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const tableToken = searchParams.get("t");
  const [outlet, setOutlet] = useState<PublicOutletInfo | null>(null);
  const [offers, setOffers] = useState<PublicOfferSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tableToken) return;
    let cancelled = false;
    setLoading(true);
    fetchOutlet(slug)
      .then((data) => {
        if (cancelled) return;
        setOutlet(data.outlet);
        setOffers(data.active_offers);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Restaurant not found");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, tableToken]);

  if (tableToken) return null;

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error || !outlet) {
    return (
      <ConsumerShell slug={slug}>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
          <p className="text-lg font-medium text-stone-800">{error}</p>
          <Link href="/" className="mt-4 text-sm font-medium text-brand">
            Back to home
          </Link>
        </div>
      </ConsumerShell>
    );
  }

  return (
    <ConsumerShell slug={slug}>
      <div className="mx-auto max-w-lg">
        <div className="px-4 pt-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
        <OutletHero outlet={outlet} />

        <div className="space-y-4 px-4 py-6">
          {offers.length > 0 && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <Tag className="h-4 w-4" />
                Offers
              </h2>
              <ul className="mt-2 space-y-2">
                {offers.map((offer) => (
                  <li key={offer.id} className="text-sm text-amber-900">
                    <span className="font-medium">{offer.title}</span>
                    {offer.description ? (
                      <span className="text-amber-800"> — {offer.description}</span>
                    ) : null}
                    <span className="ml-1 rounded bg-white/70 px-1.5 py-0.5 font-mono text-xs">
                      {offer.offer_code}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Link
            href={`/${slug}/menu`}
            className="block w-full rounded-2xl bg-brand py-4 text-center text-base font-semibold text-white shadow-lg active:scale-[0.98]"
          >
            View menu & order
          </Link>
        </div>
      </div>
    </ConsumerShell>
  );
}

export default function OutletLandingPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      }
    >
      <QrRedirect slug={params.slug} />
      <OutletLanding slug={params.slug} />
    </Suspense>
  );
}
