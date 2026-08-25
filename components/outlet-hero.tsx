import type { PublicOutletInfo } from "@/lib/types";
import { formatPrice } from "@/lib/api";
import { MapPin, Phone } from "lucide-react";

type OutletHeroProps = {
  outlet: PublicOutletInfo;
};

function isOpenNow(
  hours: Record<string, unknown> | null,
): boolean | null {
  if (!hours) return null;
  const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
  const key = dayKeys[new Date().getDay()];
  const entry = hours[key];
  if (!entry || typeof entry !== "object") return null;
  const day = entry as { closed?: boolean; open?: string; close?: string };
  if (day.closed) return false;
  if (!day.open || !day.close) return null;
  const now = new Date();
  const [oh, om] = day.open.split(":").map(Number);
  const [ch, cm] = day.close.split(":").map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;
  return mins >= openMins && mins <= closeMins;
}

export function OutletHero({ outlet }: OutletHeroProps) {
  const open = isOpenNow(outlet.opening_hours);
  const placeBits = [outlet.area, outlet.city].filter(Boolean).join(", ");

  return (
    <div className="overflow-hidden rounded-b-2xl bg-white shadow-sm">
      <div className="relative h-44 bg-stone-200">
        {outlet.cover_image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={outlet.cover_image_url}
            alt={outlet.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-brand/10 text-5xl font-bold text-brand">
            {outlet.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="relative px-4 pb-4">
        <div className="-mt-8 flex items-end gap-3">
          {outlet.logo_url ? (
            <div className="h-16 w-16 overflow-hidden rounded-xl border-4 border-white bg-white shadow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={outlet.logo_url}
                alt={outlet.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border-4 border-white bg-brand text-xl font-bold text-white shadow">
              {outlet.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900">{outlet.name}</h1>
              {outlet.is_pure_veg ? (
                <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-green-800">
                  Pure veg
                </span>
              ) : null}
              {open === true ? (
                <span className="text-xs font-medium text-green-700">Open now</span>
              ) : open === false ? (
                <span className="text-xs font-medium text-stone-500">Closed</span>
              ) : null}
            </div>
            {outlet.cuisine_tags.length > 0 ? (
              <p className="text-sm text-stone-500">
                {outlet.cuisine_tags.join(" · ")}
              </p>
            ) : null}
            {outlet.cost_for_two != null ? (
              <p className="text-xs text-stone-500">
                Cost for two · {formatPrice(outlet.cost_for_two)}
              </p>
            ) : null}
          </div>
        </div>
        {outlet.description ? (
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            {outlet.description}
          </p>
        ) : null}
        <div className="mt-3 space-y-1.5 text-sm text-stone-500">
          {outlet.address || placeBits ? (
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {outlet.address || placeBits}
            </p>
          ) : null}
          {outlet.phone ? (
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              {outlet.phone}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
