import Link from "next/link";
import type { PublicOutletSummary } from "@/lib/api";
import { MapPin } from "lucide-react";

type OutletCardProps = {
  outlet: PublicOutletSummary;
};

export function OutletCard({ outlet }: OutletCardProps) {
  return (
    <Link
      href={`/${outlet.slug}`}
      className="block overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-transform active:scale-[0.98]"
    >
      <div className="relative h-36 bg-stone-200">
        {outlet.cover_image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={outlet.cover_image_url}
            alt={outlet.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-brand/10 text-4xl font-bold text-brand">
            {outlet.name.charAt(0)}
          </div>
        )}
        {outlet.logo_url ? (
          <div className="absolute bottom-3 left-3 h-12 w-12 overflow-hidden rounded-xl border-2 border-white bg-white shadow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={outlet.logo_url}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
      </div>
      <div className="p-4">
        <h2 className="font-semibold text-stone-900">
          {outlet.name}
          {outlet.is_pure_veg ? (
            <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-green-800">
              Pure veg
            </span>
          ) : null}
        </h2>
        {outlet.cuisine_tags.length > 0 ? (
          <p className="mt-1 text-xs text-stone-500">
            {outlet.cuisine_tags.slice(0, 3).join(" · ")}
          </p>
        ) : null}
        {outlet.cost_for_two != null ? (
          <p className="mt-1 text-xs text-stone-500">
            Cost for two · ₹{outlet.cost_for_two}
          </p>
        ) : null}
        {outlet.address || outlet.city || outlet.area ? (
          <p className="mt-2 flex items-start gap-1 text-xs text-stone-400">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="line-clamp-2">
              {outlet.address ||
                [outlet.area, outlet.city].filter(Boolean).join(", ")}
            </span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}
