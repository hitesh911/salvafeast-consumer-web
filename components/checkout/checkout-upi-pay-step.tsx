"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

import { formatPrice } from "@/lib/api";
import {
  buildUpiPaymentLink,
  resolveUpiQrDisplay,
  type UpiPaymentSettings,
  type UpiQrDisplay,
} from "@/lib/upi-utils";

type CheckoutUpiPayStepProps = {
  settings: UpiPaymentSettings;
  amount: number;
  orderRef: string;
  upiLink?: string | null;
};

export function CheckoutUpiPayStep({
  settings,
  amount,
  orderRef,
  upiLink,
}: CheckoutUpiPayStepProps) {
  const [display, setDisplay] = useState<UpiQrDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const vpa = settings.upi_vpa;
  const payeeName = settings.upi_payee_name;
  const qrImageUrl = settings.upi_qr_image_url;
  const intentLink =
    upiLink ??
    (vpa
      ? buildUpiPaymentLink({
          vpa,
          amount,
          payeeName,
          orderId: orderRef,
        })
      : null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    void resolveUpiQrDisplay({
      settings: {
        upi_vpa: vpa,
        upi_payee_name: payeeName,
        upi_qr_image_url: qrImageUrl,
      },
      orderId: orderRef,
      totalAmount: amount,
    })
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setError(true);
          setDisplay(null);
          return;
        }
        setDisplay(result);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setDisplay(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [vpa, payeeName, qrImageUrl, amount, orderRef]);

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-stone-500">
        Pay with UPI
      </h2>
      <p className="mb-4 text-sm text-stone-600">
        Open your UPI app on this phone. The QR is for another device if
        someone else is paying.
      </p>
      <div className="flex flex-col items-center gap-3">
        <p className="text-2xl font-bold tabular-nums text-stone-900">
          {formatPrice(amount)}
        </p>
        {intentLink ? (
          <a
            href={intentLink}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-semibold text-white shadow-lg"
          >
            Open UPI app
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
        <div className="flex h-56 w-56 items-center justify-center overflow-hidden rounded-xl bg-stone-50 ring-1 ring-stone-200">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
          ) : error || !display ? (
            <p className="px-4 text-center text-sm text-stone-500">
              Could not load UPI QR.
            </p>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={display.qrSrc}
              alt="UPI payment QR code"
              className="h-full w-full object-contain p-2"
            />
          )}
        </div>
        {display?.vpa ? (
          <p className="font-mono text-sm text-stone-800">{display.vpa}</p>
        ) : null}
        {display?.payeeName ? (
          <p className="text-sm text-stone-500">{display.payeeName}</p>
        ) : null}
        {display?.kind === "static" ? (
          <p className="text-center text-xs text-stone-400">
            Enter the amount shown above in your UPI app.
          </p>
        ) : null}
      </div>
    </section>
  );
}
