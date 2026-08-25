"use client";

import { Loader2 } from "lucide-react";

type PromoCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  applying?: boolean;
  appliedCode?: string | null;
  error?: string | null;
};

export function PromoCodeInput({
  value,
  onChange,
  onApply,
  applying,
  appliedCode,
  error,
}: PromoCodeInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="promoCode" className="block text-sm font-medium text-stone-700">
        Promo code
      </label>
      <div className="flex gap-2">
        <input
          id="promoCode"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          placeholder="Enter code"
          className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2.5 text-sm uppercase outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
        <button
          type="button"
          onClick={onApply}
          disabled={applying || !value.trim()}
          className="shrink-0 rounded-lg border border-brand px-4 py-2.5 text-sm font-medium text-brand disabled:opacity-50"
        >
          {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </button>
      </div>
      {appliedCode ? (
        <p className="text-sm text-green-600">Code {appliedCode} will be applied at checkout</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
