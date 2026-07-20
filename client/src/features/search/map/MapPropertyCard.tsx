import { forwardRef, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, BedDouble, Heart, MapPin, Star, Zap } from "lucide-react";
import type { PropertyListCard as TCard } from "@/types";
import { cx, money } from "@/lib/format";

const FALLBACK = "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80";

const AMENITY_LABELS: Record<string, string> = {
  wifi: "WiFi",
  ac: "AC",
  parking: "Parking",
  laundry: "Laundry",
  gym: "Gym",
  "study-room": "Study room",
  "study-table": "Study table",
  meals: "Food",
  heating: "Heating",
  "security-24x7": "24x7 Security",
  cctv: "CCTV",
  elevator: "Lift",
};

const amenityLabel = (slug: string) =>
  AMENITY_LABELS[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

interface Props {
  property: TCard;
  selected: boolean;
  hovered: boolean;
  onSelect: () => void;
  onHover: (hovering: boolean) => void;
}

const MapPropertyCard = forwardRef<HTMLDivElement, Props>(function MapPropertyCard(
  { property: p, selected, hovered, onSelect, onHover },
  ref
) {
  const [wished, setWished] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Border/highlight animation whenever this card becomes selected.
  useEffect(() => {
    if (!selected || !highlightRef.current) return;
    const el = highlightRef.current;
    el.classList.remove("animate-card-highlight");
    void el.offsetWidth; // restart animation
    el.classList.add("animate-card-highlight");
  }, [selected]);

  const roomType = p.room_types?.[0]?.replace("_", " ");

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" ? onSelect() : undefined)}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="scroll-mt-4"
    >
      <div
        ref={highlightRef}
        className={cx(
          "card group flex cursor-pointer gap-3 overflow-hidden p-3 transition duration-200",
          selected
            ? "ring-2 ring-brand-500"
            : hovered
              ? "ring-2 ring-brand-200"
              : "ring-1 ring-slate-100 hover:ring-slate-200"
        )}
      >
        {/* Cover image (lazy) */}
        <Link
          to={`/property/${p.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="relative block h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-36 sm:w-40"
        >
          {!imgLoaded && <div className="shimmer absolute inset-0 bg-slate-100" />}
          <img
            src={p.cover_image_url ?? FALLBACK}
            alt={p.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={cx(
              "h-full w-full object-cover transition duration-500 group-hover:scale-105",
              imgLoaded ? "opacity-100" : "opacity-0"
            )}
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setWished((w) => !w);
            }}
            aria-label="Add to wishlist"
            className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/85 text-slate-700 backdrop-blur transition hover:scale-110"
          >
            <Heart size={14} className={wished ? "fill-accent-500 text-accent-500" : ""} />
          </button>
        </Link>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              to={`/property/${p.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="line-clamp-1 font-semibold text-slate-900 hover:underline"
            >
              {p.name}
            </Link>
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              {p.avg_rating.toFixed(1)}
              <span className="text-slate-400">({p.review_count})</span>
            </span>
          </div>

          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <MapPin size={12} />
            <span className="line-clamp-1">
              {p.area ?? p.address ?? "—"}
              {p.distance_km != null && (
                <span className="text-slate-400"> · {p.distance_km.toFixed(1)} km away</span>
              )}
            </span>
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
            {p.is_verified && (
              <span className="chip gap-0.5 border-brand-100 bg-brand-50 px-2 py-0.5 text-brand-700">
                <BadgeCheck size={11} /> Verified
              </span>
            )}
            {p.instant_booking && (
              <span className="chip gap-0.5 border-emerald-100 bg-emerald-50 px-2 py-0.5 text-emerald-700">
                <Zap size={11} /> Instant
              </span>
            )}
            {roomType && <span className="chip px-2 py-0.5 capitalize">{roomType}</span>}
            {p.available_beds > 0 && (
              <span className="chip gap-0.5 px-2 py-0.5 text-slate-600">
                <BedDouble size={11} /> {p.available_beds} beds
              </span>
            )}
          </div>

          {p.amenities?.length > 0 && (
            <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">
              {p.amenities.slice(0, 4).map(amenityLabel).join(" · ")}
              {p.amenities.length > 4 && ` · +${p.amenities.length - 4}`}
            </p>
          )}

          <div className="mt-2 flex items-end justify-between">
            <p className="text-sm">
              <span className="text-base font-bold text-slate-900">
                {money(p.min_price, p.currency)}
              </span>
              <span className="text-slate-500"> / mo</span>
            </p>
            {p.min_deposit != null && (
              <p className="text-[11px] text-slate-500">
                Deposit {money(p.min_deposit, p.currency)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default MapPropertyCard;
