import { SlidersHorizontal } from "lucide-react";
import type { SearchFilters } from "@/types";

const ROOM_TYPES = ["shared", "private", "ensuite", "studio", "apartment", "twin_sharing", "triple_sharing"];
const AMENITIES: { key: keyof SearchFilters; label: string }[] = [
  { key: "wifi", label: "WiFi" },
  { key: "gym", label: "Gym" },
  { key: "laundry", label: "Laundry" },
  { key: "parking", label: "Parking" },
  { key: "ac", label: "AC" },
  { key: "bills_included", label: "Bills included" },
  { key: "instant_booking", label: "Instant booking" },
  { key: "verified_only", label: "Verified only" },
];

interface Props {
  filters: SearchFilters;
  onChange: (patch: Partial<SearchFilters>) => void;
}

export default function FilterSidebar({ filters, onChange }: Props) {
  const toggleRoom = (rt: string) => {
    const current = filters.room_type ?? [];
    const next = current.includes(rt as any)
      ? current.filter((r) => r !== rt)
      : [...current, rt as any];
    onChange({ room_type: next });
  };

  return (
    <aside className="w-full shrink-0 lg:w-72">
      <div className="card sticky top-20 space-y-6 p-5">
        <div className="flex items-center gap-2 font-bold">
          <SlidersHorizontal size={18} /> Filters
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Budget (per month)</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              className="input"
              value={filters.price_min ?? ""}
              onChange={(e) => onChange({ price_min: e.target.value ? +e.target.value : undefined })}
            />
            <span className="text-slate-400">–</span>
            <input
              type="number"
              placeholder="Max"
              className="input"
              value={filters.price_max ?? ""}
              onChange={(e) => onChange({ price_max: e.target.value ? +e.target.value : undefined })}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Room type</p>
          <div className="flex flex-wrap gap-2">
            {ROOM_TYPES.map((rt) => (
              <button
                key={rt}
                onClick={() => toggleRoom(rt)}
                className={`chip capitalize ${
                  filters.room_type?.includes(rt as any)
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : ""
                }`}
              >
                {rt.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Amenities</p>
          <div className="space-y-2">
            {AMENITIES.map((a) => (
              <label key={a.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                  checked={Boolean(filters[a.key])}
                  onChange={(e) => onChange({ [a.key]: e.target.checked || undefined } as any)}
                />
                {a.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Max distance to university</p>
          <input
            type="range"
            min={1}
            max={20}
            value={filters.max_distance_km ?? 20}
            onChange={(e) => onChange({ max_distance_km: +e.target.value })}
            className="w-full accent-brand-600"
          />
          <p className="text-xs text-slate-500">{filters.max_distance_km ?? 20} km</p>
        </div>
      </div>
    </aside>
  );
}
