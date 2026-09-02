"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { CartBillSummary } from "@/components/cart/cart-bill-summary";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { CartOutletHeader } from "@/components/cart/cart-outlet-header";
import { PromoCodeInput } from "@/components/promo-code-input";
import {
  formatPrice,
  fetchMenu,
  fetchMyProfile,
  placeOrder,
  updateMyProfile,
} from "@/lib/api";
import { isConsumerLoggedIn } from "@/lib/auth-store";
import { useCart } from "@/lib/cart-store";
import { buildCartLineLabel } from "@/lib/order-line-labels";
import { savePlacedOrder } from "@/lib/order-cache";
import type { OrderType, PaymentCollection } from "@/lib/types";
import { isUpiConfigured } from "@/lib/upi-utils";
import clsx from "clsx";

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  dine_in: "Dine in",
  pickup: "Pickup",
  counter: "Counter",
  pre_order: "Pre-order",
};

export default function CheckoutPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const {
    lines,
    subtotal,
    itemCount,
    tableToken,
    menuContext,
    setMenuContext,
    defaultOrderType,
    clearCart,
  } = useCart();

  const availableTypes =
    menuContext?.ordering.available_order_types ?? ["counter", "pickup"];

  const scannedTableNumber =
    menuContext?.ordering.scanned_table_number ?? "";
  const availableTables = useMemo(
    () => menuContext?.ordering.tables ?? [],
    [menuContext?.ordering.tables],
  );

  const userPickedOrderType = useRef(false);
  const [orderType, setOrderType] = useState<OrderType>(defaultOrderType);
  const [selectedTableToken, setSelectedTableToken] = useState<string | null>(
    tableToken,
  );
  const [loadingTables, setLoadingTables] = useState(!menuContext);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [profileName, setProfileName] = useState("");
  const [needsProfileName, setNeedsProfileName] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loggedIn = isConsumerLoggedIn();

  useEffect(() => {
    if (!loggedIn) {
      setNeedsProfileName(false);
      return;
    }
    let cancelled = false;
    fetchMyProfile()
      .then((profile) => {
        if (cancelled) return;
        const hasName = Boolean(profile.name?.trim());
        setNeedsProfileName(!hasName);
        setProfileName(profile.name ?? "");
      })
      .catch(() => {
        if (!cancelled) setNeedsProfileName(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  useEffect(() => {
    if (menuContext) {
      setLoadingTables(false);
      return;
    }

    let cancelled = false;
    setLoadingTables(true);

    fetchMenu(params.slug, tableToken)
      .then((data) => {
        if (cancelled) return;
        setMenuContext(data);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Could not load outlet details. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoadingTables(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.slug, tableToken, menuContext, setMenuContext]);

  useEffect(() => {
    if (!menuContext || userPickedOrderType.current) return;
    const nextType = menuContext.ordering.default_order_type;
    setOrderType((current) => (current === nextType ? current : nextType));
  }, [menuContext]);

  useEffect(() => {
    if (tableToken) {
      setSelectedTableToken(tableToken);
      return;
    }
    if (!scannedTableNumber || availableTables.length === 0) return;
    const match = availableTables.find(
      (table) => table.table_number === scannedTableNumber,
    );
    if (match) setSelectedTableToken(match.qr_token);
  }, [tableToken, scannedTableNumber, availableTables]);

  const dineInTableMissing =
    orderType === "dine_in" &&
    availableTables.length > 0 &&
    !selectedTableToken;
  const dineInNoTables =
    orderType === "dine_in" && !loadingTables && availableTables.length === 0;

  const requireLogin = menuContext?.ordering.require_customer_login ?? false;
  const requirePrepaid = menuContext?.ordering.require_prepaid ?? false;
  const upiSettings = {
    upi_vpa: menuContext?.ordering.upi_vpa ?? null,
    upi_payee_name: menuContext?.ordering.upi_payee_name ?? null,
    upi_qr_image_url: menuContext?.ordering.upi_qr_image_url ?? null,
  };
  const upiReady = isUpiConfigured(upiSettings);
  const showGuestFields = !requireLogin && !loggedIn;

  function handleApplyPromo() {
    const code = promoInput.trim();
    if (!code) return;
    setAppliedPromo(code.toUpperCase());
    setPromoError(null);
  }

  async function submitOrder(collection?: PaymentCollection) {
    if (itemCount === 0) return;
    if (requireLogin || dineInTableMissing || dineInNoTables) return;
    if (requirePrepaid && !collection) return;
    if (collection === "upi" && !upiReady) {
      setError("This outlet is not accepting UPI yet.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (loggedIn && needsProfileName) {
        const trimmed = profileName.trim();
        if (!trimmed) {
          setError("Add your name so the kitchen can call your order.");
          setSubmitting(false);
          return;
        }
        await updateMyProfile({ name: trimmed });
        setNeedsProfileName(false);
      }

      const payload = {
        order_type: orderType,
        table_qr_token: orderType === "dine_in" ? selectedTableToken : null,
        guest_name: showGuestFields ? guestName.trim() || null : null,
        guest_phone: showGuestFields ? guestPhone.trim() || null : null,
        offer_code: appliedPromo,
        collection: requirePrepaid ? collection : null,
        items: lines.map((line) => ({
          menu_item_id: line.menuItemId,
          variant_id: line.variantId,
          quantity: line.quantity,
          addon_ids: line.addons.map((a) => a.id),
          notes: line.notes ?? null,
        })),
      };

      const result = await placeOrder(params.slug, payload);
      savePlacedOrder(params.slug, result.order.id, {
        ...result,
        table_qr_token: orderType === "dine_in" ? selectedTableToken : null,
        line_labels: lines.map((line) => ({
          menu_item_id: line.menuItemId,
          variant_id: line.variantId,
          addon_ids: line.addons.map((addon) => addon.id),
          label: buildCartLineLabel(
            line.name,
            line.variantName,
            line.addons.map((addon) => addon.name),
          ),
        })),
      });
      clearCart();
      router.push(
        `/${params.slug}/orders/${result.order.id}?token=${encodeURIComponent(result.tracking_token)}`,
      );
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: unknown } } };
      const detail = axiosErr?.response?.data?.detail;
      if (typeof detail === "string") {
        if (detail.toLowerCase().includes("offer")) {
          setPromoError(detail);
          setAppliedPromo(null);
        }
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d: { msg?: string }) => d.msg).join(", "));
      } else {
        setError("Could not place order. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (requirePrepaid) return;
    await submitOrder();
  }

  if (itemCount === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <p className="text-stone-500">Nothing to checkout</p>
        <Link
          href={`/${params.slug}/menu`}
          className="mt-4 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white"
        >
          Back to menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-stone-50 pb-8">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link
            href={`/${params.slug}/cart`}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold text-stone-900">Checkout</h1>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-lg space-y-6 px-4 py-6"
      >
        {/* Order summary */}
        <section className="space-y-4">
          <CartOutletHeader
            slug={params.slug}
            menuContext={menuContext}
            compact
          />
          <div className="space-y-3">
            {lines.map((line) => (
              <CartLineItem
                key={line.key}
                line={line}
                menuContext={menuContext}
                readOnly
              />
            ))}
          </div>
          <CartBillSummary subtotal={subtotal} itemCount={itemCount} />
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-4">
          <PromoCodeInput
            value={promoInput}
            onChange={setPromoInput}
            onApply={handleApplyPromo}
            appliedCode={appliedPromo}
            error={promoError}
          />
        </section>

        {/* Order type */}
        <section className="rounded-xl border border-stone-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
            Order type
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {availableTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  userPickedOrderType.current = true;
                  setOrderType(type);
                }}
                className={clsx(
                  "rounded-lg border py-2.5 text-sm font-medium transition-colors",
                  orderType === type
                    ? "border-brand bg-brand text-white"
                    : "border-stone-200 bg-white text-stone-700",
                )}
              >
                {ORDER_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
          {orderType === "dine_in" && (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium text-stone-700">
                Select your table
              </p>
              {loadingTables ? (
                <div className="flex items-center gap-2 py-2 text-sm text-stone-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading tables…
                </div>
              ) : availableTables.length === 0 ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                  Tables not available here
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {availableTables.map((table) => (
                    <button
                      key={table.qr_token}
                      type="button"
                      onClick={() => setSelectedTableToken(table.qr_token)}
                      className={clsx(
                        "rounded-lg border py-2.5 text-sm font-medium transition-colors",
                        selectedTableToken === table.qr_token
                          ? "border-brand bg-brand text-white"
                          : "border-stone-200 bg-white text-stone-700 hover:border-stone-300",
                      )}
                    >
                      {table.table_number}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Guest / profile info */}
        {!requireLogin && loggedIn && !needsProfileName && (
          <section className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
            Ordering as a signed-in customer. Your order will appear in My orders.
          </section>
        )}

        {loggedIn && needsProfileName && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="mb-1 text-sm font-semibold text-amber-900">
              Finish your profile
            </h2>
            <p className="mb-3 text-sm text-amber-800">
              Add your name so staff can find your order. You can update more
              details later in{" "}
              <Link href="/account" className="font-medium underline">
                Account
              </Link>
              .
            </p>
            <label
              htmlFor="profileName"
              className="mb-1 block text-sm font-medium text-amber-900"
            >
              Name
            </label>
            <input
              id="profileName"
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </section>
        )}

        {showGuestFields && (
          <section className="rounded-xl border border-stone-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
              Your details
            </h2>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="guestName"
                  className="mb-1 block text-sm font-medium text-stone-700"
                >
                  Name
                </label>
                <input
                  id="guestName"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label
                  htmlFor="guestPhone"
                  className="mb-1 block text-sm font-medium text-stone-700"
                >
                  Phone
                </label>
                <input
                  id="guestPhone"
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          </section>
        )}

        {requireLogin && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            This outlet requires you to sign in before ordering.{" "}
            <Link
              href={`/${params.slug}/login?returnTo=/${params.slug}/checkout`}
              className="font-medium underline"
            >
              Sign in to continue
            </Link>
          </div>
        )}

        {requirePrepaid && (
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
            This outlet confirms payment before sending your order to the
            kitchen. Pay in your UPI app, or pay at the counter.
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {requirePrepaid ? (
          <div className="space-y-3">
            <button
              type="button"
              disabled={
                submitting ||
                requireLogin ||
                dineInTableMissing ||
                dineInNoTables ||
                !upiReady
              }
              onClick={() => void submitOrder("upi")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-semibold text-white shadow-lg disabled:opacity-50 active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Placing order…
                </>
              ) : (
                `Pay with UPI · ${formatPrice(subtotal)}`
              )}
            </button>
            {!upiReady ? (
              <p className="text-center text-xs text-stone-500">
                UPI is not set up for this outlet yet.
              </p>
            ) : null}
            <button
              type="button"
              disabled={
                submitting ||
                requireLogin ||
                dineInTableMissing ||
                dineInNoTables
              }
              onClick={() => void submitOrder("counter")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white py-3.5 font-semibold text-stone-800 disabled:opacity-50"
            >
              Pay at counter · {formatPrice(subtotal)}
            </button>
          </div>
        ) : (
          <button
            type="submit"
            disabled={
              submitting ||
              requireLogin ||
              dineInTableMissing ||
              dineInNoTables
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-semibold text-white shadow-lg disabled:opacity-50 active:scale-[0.98]"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Placing order…
              </>
            ) : (
              `Place order · ${formatPrice(subtotal)}`
            )}
          </button>
        )}
      </form>
    </div>
  );
}
