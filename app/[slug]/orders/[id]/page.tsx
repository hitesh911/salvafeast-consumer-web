"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Bell,
  Loader2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import {
  cancelOrder,
  calcItemUnitPrice,
  fetchMenu,
  fetchMyOrderDetail,
  fetchOrderStatus,
  formatPrice,
  requestCancelOrder,
} from "@/lib/api";
import { isConsumerLoggedIn } from "@/lib/auth-store";
import { useCart } from "@/lib/cart-store";
import { getPlacedOrder } from "@/lib/order-cache";
import type {
  OrderItemResponse,
  OrderStatus,
  PublicOrderItemStatus,
  PublicOrderStatusResponse,
} from "@/lib/types";
import { CheckoutUpiPayStep } from "@/components/checkout/checkout-upi-pay-step";
import { OrderLineSummary } from "@/components/order-line-summary";
import clsx from "clsx";

const POLL_INTERVAL_MS = 5000;

const STATUS_STEPS: {
  key: OrderStatus;
  label: string;
  icon: typeof Clock;
}[] = [
  { key: "placed", label: "Placed", icon: Clock },
  { key: "accepted", label: "Accepted", icon: CheckCircle2 },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "ready", label: "Ready", icon: Bell },
  { key: "served", label: "Served", icon: CheckCircle2 },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
];

function statusIndex(status: OrderStatus): number {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

const REQUEST_CANCEL_STATUSES: OrderStatus[] = [
  "accepted",
  "preparing",
  "ready",
  "served",
];
const READY_OR_SERVED: OrderStatus[] = ["ready", "served"];

function OrderTrackingContent({
  params,
}: {
  params: { slug: string; id: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token");
  const fromAccount = searchParams.get("from") === "account";
  const { addLine, setMenuContext, clearCart, tableToken } = useCart();

  const cachedOrder = getPlacedOrder(params.slug, params.id);
  const [trackingToken, setTrackingToken] = useState<string | null>(tokenParam);
  const [upiLink, setUpiLink] = useState<string | null>(
    cachedOrder?.upi_payment_link ?? null,
  );
  const [order, setOrder] = useState<PublicOrderStatusResponse | null>(null);
  const [itemNames, setItemNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [cancelAction, setCancelAction] = useState<
    "cancel" | "request" | null
  >(null);

  useEffect(() => {
    if (tokenParam) {
      setTrackingToken(tokenParam);
      return;
    }
    if (fromAccount && isConsumerLoggedIn()) {
      fetchMyOrderDetail(params.id)
        .then((detail) => {
          setTrackingToken(detail.tracking_token);
          if (cachedOrder?.upi_payment_link) return;
          setUpiLink(null);
        })
        .catch(() => {
          setError("Could not load order details");
          setLoading(false);
        });
    }
  }, [tokenParam, fromAccount, params.id, cachedOrder?.upi_payment_link]);

  useEffect(() => {
    if (!trackingToken) {
      if (!fromAccount || !isConsumerLoggedIn()) {
        setError("Missing tracking token");
        setLoading(false);
      }
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval>;

    async function poll() {
      try {
        const data = await fetchOrderStatus(
          params.slug,
          params.id,
          trackingToken!,
        );
        if (cancelled) return;
        setOrder(data);
        setError(null);

        const terminal = ["completed", "cancelled"].includes(data.status);
        if (terminal && timer) clearInterval(timer);
      } catch (err: unknown) {
        if (cancelled) return;
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        setError(
          axiosErr?.response?.data?.detail ?? "Could not load order status",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    poll();
    timer = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [params.slug, params.id, trackingToken, fromAccount]);

  useEffect(() => {
    if (cachedOrder?.order.items) {
      const names: Record<string, string> = {};
      cachedOrder.order.items.forEach((item) => {
        names[item.menu_item_id] = `Item`;
      });
      setItemNames(names);
    }
  }, [cachedOrder]);

  const displayItems = useMemo(() => {
    if (order?.items?.length) return order.items;
    if (cachedOrder?.order.items) {
      return cachedOrder.order.items.map((item) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        item_price_at_order: item.item_price_at_order,
        notes: item.notes,
      }));
    }
    return [];
  }, [order, cachedOrder]);

  async function handleCancelOrder() {
    if (!trackingToken || !order) return;
    if (
      !window.confirm(
        "Cancel this order? It has not been accepted by the kitchen yet.",
      )
    ) {
      return;
    }
    setCancelAction("cancel");
    setError(null);
    try {
      const updated = await cancelOrder(params.slug, params.id, trackingToken);
      setOrder(updated);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(
        axiosErr?.response?.data?.detail ?? "Could not cancel order",
      );
    } finally {
      setCancelAction(null);
    }
  }

  async function handleRequestCancel() {
    if (!trackingToken || !order) return;
    if (
      !window.confirm(
        "Request cancellation? The outlet will confirm whether the order can be cancelled.",
      )
    ) {
      return;
    }
    setCancelAction("request");
    setError(null);
    try {
      const updated = await requestCancelOrder(
        params.slug,
        params.id,
        trackingToken,
      );
      setOrder(updated);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(
        axiosErr?.response?.data?.detail ?? "Could not request cancellation",
      );
    } finally {
      setCancelAction(null);
    }
  }

  async function handleReorder() {
    setReordering(true);
    setActionMessage(null);
    try {
      const menu = await fetchMenu(params.slug);
      setMenuContext(menu);

      type ReorderLine = {
        menu_item_id: string;
        variant_id: string | null;
        quantity: number;
        notes: string | null;
        addons: { addon_id: string }[];
      };

      function fromDetailItems(items: OrderItemResponse[]): ReorderLine[] {
        return items.map((line) => ({
          menu_item_id: line.menu_item_id,
          variant_id: line.variant_id,
          quantity: line.quantity,
          notes: line.notes,
          addons: line.addons.map((a) => ({ addon_id: a.addon_id })),
        }));
      }

      function fromStatusItems(items: PublicOrderItemStatus[]): ReorderLine[] {
        return items.map((line) => ({
          menu_item_id: line.menu_item_id,
          variant_id: line.variant_id,
          quantity: line.quantity,
          notes: line.notes,
          addons: (line.addons ?? []).map((a) => ({ addon_id: a.addon_id })),
        }));
      }

      let lines: ReorderLine[] | null = null;
      if (cachedOrder?.order?.items?.length) {
        lines = fromDetailItems(cachedOrder.order.items);
      } else if (isConsumerLoggedIn()) {
        try {
          const mine = await fetchMyOrderDetail(params.id);
          if (mine.order?.items?.length) {
            lines = fromDetailItems(mine.order.items);
          }
        } catch {
          /* fall through to status items */
        }
      }
      if (!lines?.length && order?.items?.length) {
        lines = fromStatusItems(order.items);
      }

      if (!lines?.length) {
        setActionMessage(
          "Couldn’t reload this order. Try opening the menu and adding items again.",
        );
        return;
      }

      clearCart();
      let added = 0;
      let skipped = 0;

      for (const line of lines) {
        const menuItem = menu.menu
          .flatMap((c) => c.items)
          .find((item) => item.id === line.menu_item_id);
        if (!menuItem) {
          skipped += 1;
          continue;
        }
        const variant = line.variant_id
          ? menuItem.variants.find((v) => v.id === line.variant_id)
          : null;
        if (line.variant_id && !variant) {
          skipped += 1;
          continue;
        }
        const addonIds = new Set(line.addons.map((a) => a.addon_id));
        const addons = menuItem.addons
          .filter((a) => addonIds.has(a.id))
          .map((a) => ({ id: a.id, name: a.name, price: a.price }));
        const unitPrice = calcItemUnitPrice(
          menuItem.base_price,
          variant?.price_delta,
          addons.map((a) => a.price),
        );

        addLine({
          menuItemId: line.menu_item_id,
          name: menuItem.name,
          variantId: variant?.id ?? null,
          variantName: variant?.name ?? null,
          addons,
          quantity: line.quantity,
          unitPrice,
          imageUrl: menuItem.images[0]?.image_url ?? null,
          dietaryType: menuItem.dietary_type,
          notes: line.notes ?? undefined,
        });
        added += 1;
      }

      if (added === 0) {
        setActionMessage(
          skipped > 0
            ? "Those items are no longer available on the menu."
            : "Couldn’t add items to your cart.",
        );
        return;
      }

      if (skipped > 0) {
        setActionMessage(
          `${skipped} item${skipped === 1 ? "" : "s"} unavailable and skipped.`,
        );
      }
      router.push(`/${params.slug}/cart`);
    } catch {
      setActionMessage("Something went wrong while rebuilding your cart.");
    } finally {
      setReordering(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <XCircle className="mb-4 h-12 w-12 text-red-400" />
        <p className="text-lg font-medium text-stone-800">Order not found</p>
        <p className="mt-2 text-sm text-stone-500">{error}</p>
        <Link
          href={`/${params.slug}/menu`}
          className="mt-6 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white"
        >
          Back to menu
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const isCancelled = order.status === "cancelled";
  const isPaymentReview = order.status === "payment_review";
  const cancelPending = order.cancel_request_status === "pending";
  const canCancelNow =
    (order.status === "placed" || isPaymentReview) && !cancelPending;
  const canRequestCancel =
    REQUEST_CANCEL_STATUSES.includes(order.status) && !cancelPending;
  const KITCHEN_STATUSES: OrderStatus[] = ["placed", "accepted", "preparing"];
  const currentIdx = statusIndex(order.status);
  const discount = parseFloat(order.discount_amount ?? "0");
  const showQueueCard =
    !isPaymentReview && KITCHEN_STATUSES.includes(order.status);
  const showReadyCard = READY_OR_SERVED.includes(order.status);
  const showUpiPay =
    isPaymentReview &&
    order.payment_status === "unpaid" &&
    (order.payment_collection === "upi" || Boolean(order.upi_vpa));

  return (
    <div className="min-h-dvh bg-stone-50 pb-8">
      <header className="border-b border-stone-200 bg-white px-4 py-6 text-center">
        <p className="text-sm text-stone-500">Order tracking</p>
        <h1 className="mt-1 text-2xl font-bold text-stone-900">
          {formatPrice(order.total_amount)}
        </h1>
        {order.table_number && (
          <p className="mt-1 text-sm text-stone-500">
            Table {order.table_number}
          </p>
        )}
      </header>

      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        {upiLink &&
        order.payment_status === "unpaid" &&
        !isPaymentReview ? (
          <a
            href={upiLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-semibold text-white shadow-lg"
          >
            Pay now with UPI
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}

        <OrderLineSummary items={displayItems} itemNames={itemNames} />

        {isCancelled ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <XCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
            <p className="text-lg font-semibold text-red-800">Order cancelled</p>
            {order.cancelled_by === "user" ? (
              <p className="mt-1 text-sm text-red-700">Cancelled by you</p>
            ) : order.cancelled_by === "staff" ? (
              <p className="mt-1 text-sm text-red-700">
                Cancelled by the outlet
              </p>
            ) : null}
            {order.payment_status === "paid" ? (
              <p className="mt-3 text-sm text-red-700">
                If you paid by UPI, contact the outlet about a refund.
              </p>
            ) : null}
          </div>
        ) : (
          <>
            {isPaymentReview ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Waiting for the outlet to confirm payment. Your order will go
                to the kitchen after they confirm.
                {order.payment_collection === "counter" ? (
                  <span className="mt-2 block">
                    Pay at the counter. Staff will confirm when they receive
                    payment.
                  </span>
                ) : null}
              </div>
            ) : null}

            {showUpiPay ? (
              <CheckoutUpiPayStep
                settings={{
                  upi_vpa: order.upi_vpa,
                  upi_payee_name: order.upi_payee_name,
                  upi_qr_image_url: order.upi_qr_image_url,
                }}
                amount={parseFloat(order.total_amount)}
                orderRef={order.id}
                upiLink={upiLink}
              />
            ) : null}

            {cancelPending ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Cancellation requested — waiting for the outlet to confirm.
              </div>
            ) : null}

            {canCancelNow ? (
              <button
                type="button"
                onClick={() => void handleCancelOrder()}
                disabled={cancelAction !== null}
                className="w-full rounded-xl border border-red-200 bg-white py-3 text-sm font-medium text-red-700 disabled:opacity-50"
              >
                {cancelAction === "cancel" ? "Cancelling…" : "Cancel order"}
              </button>
            ) : null}

            {canRequestCancel ? (
              <button
                type="button"
                onClick={() => void handleRequestCancel()}
                disabled={cancelAction !== null}
                className="w-full rounded-xl border border-stone-300 bg-white py-3 text-sm font-medium text-stone-800 disabled:opacity-50"
              >
                {cancelAction === "request"
                  ? "Submitting request…"
                  : "Request cancellation"}
              </button>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {actionMessage ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {actionMessage}
              </div>
            ) : null}

            {showQueueCard || showReadyCard ? (
              <div className="rounded-xl border border-brand/20 bg-brand/5 p-5">
                {showReadyCard ? (
                  <>
                    <p className="text-lg font-semibold text-brand">
                      {order.order_type === "dine_in"
                        ? "Ready — heading to your table"
                        : "Ready for pickup"}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      Your order is ready. We’ll see you soon.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-stone-900">
                      {order.orders_ahead === 0
                        ? "You’re next"
                        : order.orders_ahead === 1
                          ? "1 order ahead"
                          : `${order.orders_ahead} orders ahead`}
                    </p>
                    {order.queue_position != null ? (
                      <p className="mt-1 text-sm text-stone-500">
                        Position #{order.queue_position} in the kitchen queue
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}

            {!isPaymentReview ? (
            <div className="rounded-xl border border-stone-200 bg-white p-6">
              <div className="space-y-0">
                {STATUS_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const done = idx <= currentIdx;
                  const active = idx === currentIdx;

                  return (
                    <div key={step.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={clsx(
                            "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                            done
                              ? "border-brand bg-brand text-white"
                              : "border-stone-200 bg-white text-stone-300",
                            active && "ring-4 ring-brand/20",
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        {idx < STATUS_STEPS.length - 1 && (
                          <div
                            className={clsx(
                              "my-1 min-h-[24px] w-0.5 flex-1",
                              idx < currentIdx ? "bg-brand" : "bg-stone-200",
                            )}
                          />
                        )}
                      </div>
                      <div className="pb-6 pt-2">
                        <p
                          className={clsx(
                            "font-medium",
                            done ? "text-stone-900" : "text-stone-400",
                            active && "text-brand",
                          )}
                        >
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            ) : null}
          </>
        )}

        <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Subtotal</span>
            <span>{formatPrice(order.subtotal_amount ?? order.total_amount)}</span>
          </div>
          {discount > 0 ? (
            <div className="mt-2 flex justify-between text-green-700">
              <span>Discount</span>
              <span>−{formatPrice(discount)}</span>
            </div>
          ) : null}
          <div className="mt-2 flex justify-between">
            <span className="text-stone-500">Payment</span>
            <span
              className={clsx(
                "font-medium capitalize",
                order.payment_status === "paid"
                  ? "text-green-600"
                  : "text-amber-600",
              )}
            >
              {order.payment_status}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReorder}
          disabled={reordering}
          className="block w-full rounded-xl border border-brand py-3 text-center text-sm font-medium text-brand disabled:opacity-50"
        >
          {reordering ? "Adding to cart…" : "Order again"}
        </button>

        <Link
          href={
            tableToken
              ? `/${params.slug}/menu?t=${encodeURIComponent(tableToken)}`
              : `/${params.slug}/menu`
          }
          className="block w-full rounded-xl border border-stone-200 bg-white py-3 text-center text-sm font-medium text-stone-700"
        >
          Order more
        </Link>
      </div>
    </div>
  );
}

export default function OrderTrackingPage({
  params,
}: {
  params: { slug: string; id: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      }
    >
      <OrderTrackingContent params={params} />
    </Suspense>
  );
}
