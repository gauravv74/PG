import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { BadgeCheck } from "lucide-react";
import type { MapPin } from "@/types";
import { money } from "@/lib/format";
import { cx } from "@/lib/format";

interface Props {
  pin: MapPin;
  selected: boolean;
  hovered: boolean;
  onSelect: () => void;
  onHover: (hovering: boolean) => void;
}

/**
 * Custom Airbnb-style price marker. Replaces the default Google pin with a
 * rounded pill showing the monthly rent. Handles hover, selected and verified
 * states with smooth transitions.
 */
export default function PriceMarker({ pin, selected, hovered, onSelect, onHover }: Props) {
  const label = pin.min_price != null ? money(pin.min_price, pin.currency) : "View";

  return (
    <AdvancedMarker
      position={{ lat: pin.latitude, lng: pin.longitude }}
      onClick={onSelect}
      zIndex={selected ? 1000 : hovered ? 900 : pin.is_verified ? 2 : 1}
      className="animate-marker-pop"
    >
      <div
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        className={cx(
          "flex -translate-y-1/2 cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold shadow-card transition-all duration-200 will-change-transform",
          selected
            ? "scale-110 border-brand-600 bg-brand-600 text-white ring-2 ring-brand-200"
            : hovered
              ? "scale-105 border-slate-900 bg-white text-slate-900"
              : "border-slate-200 bg-white text-slate-900 hover:border-slate-900"
        )}
      >
        {pin.is_verified && (
          <BadgeCheck
            size={13}
            className={selected ? "text-white" : "text-brand-600"}
            aria-label="Verified"
          />
        )}
        {label}
      </div>
    </AdvancedMarker>
  );
}
