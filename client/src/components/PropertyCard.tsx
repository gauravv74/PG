import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeCheck, Heart, Star, Zap } from "lucide-react";
import { useState } from "react";
import type { PropertyCard as TProperty } from "@/types";
import { money } from "@/lib/format";

const FALLBACK =
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80";

export default function PropertyCard({ property }: { property: TProperty }) {
  const [wished, setWished] = useState(false);
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group w-[280px] shrink-0 sm:w-auto"
    >
      <Link to={`/property/${property.slug}`} className="block">
        <div className="relative overflow-hidden rounded-2xl">
          <img
            src={property.cover_image_url ?? FALLBACK}
            alt={property.name}
            loading="lazy"
            className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              setWished(!wished);
            }}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/85 text-slate-700 backdrop-blur transition hover:scale-110"
            aria-label="Add to wishlist"
          >
            <Heart size={18} className={wished ? "fill-accent-500 text-accent-500" : ""} />
          </button>
          <div className="absolute left-3 top-3 flex gap-1.5">
            {property.is_verified && (
              <span className="chip bg-white/90 text-brand-700">
                <BadgeCheck size={13} /> Verified
              </span>
            )}
            {property.instant_booking && (
              <span className="chip bg-white/90 text-emerald-700">
                <Zap size={13} /> Instant
              </span>
            )}
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-semibold text-slate-900">{property.name}</h3>
            <span className="flex items-center gap-1 text-sm font-medium">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              {property.avg_rating.toFixed(1)}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
            {property.summary ?? property.property_type}
          </p>
          <p className="mt-2 text-sm">
            <span className="text-base font-bold text-slate-900">
              {money(property.min_price, property.currency)}
            </span>
            <span className="text-slate-500"> / month</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
