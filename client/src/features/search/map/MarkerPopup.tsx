import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { MapPin } from "@/types";
import { money } from "@/lib/format";

const FALLBACK = "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&q=80";

/** Hover/selected preview card anchored above its marker. Click → details. */
export default function MarkerPopup({
  pin,
  onHover,
}: {
  pin: MapPin;
  onHover: (hovering: boolean) => void;
}) {
  return (
    <AdvancedMarker position={{ lat: pin.latitude, lng: pin.longitude }} zIndex={2000}>
      <div
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        className="w-56 -translate-x-1/2 -translate-y-[calc(100%+18px)] overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-200"
      >
        <Link to={`/property/${pin.slug}`}>
          <div className="relative h-28 w-full overflow-hidden">
            <img
              src={pin.cover_image_url ?? FALLBACK}
              alt={pin.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            {pin.room_type && (
              <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-700">
                {pin.room_type.replace("_", " ")}
              </span>
            )}
          </div>
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <h4 className="line-clamp-1 text-sm font-semibold text-slate-900">{pin.name}</h4>
              <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                {pin.avg_rating.toFixed(1)}
              </span>
            </div>
            <p className="mt-1 text-sm">
              <span className="font-bold text-slate-900">{money(pin.min_price, pin.currency)}</span>
              <span className="text-slate-500"> / month</span>
            </p>
          </div>
        </Link>
        {/* little pointer */}
        <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white ring-1 ring-slate-200" />
      </div>
    </AdvancedMarker>
  );
}
