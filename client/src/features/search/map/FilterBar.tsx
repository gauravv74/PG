import { Check, ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import type { PropertyType, RoomType, SearchFilters } from "@/types";
import { cx } from "@/lib/format";
import { useMapSearch } from "./MapSearchContext";
import { AMENITY_FILTERS, GENDERS, PROPERTY_TYPES, ROOM_TYPES } from "./constants";

/** A lightweight popover using the native <details> element (no extra deps). */
function Popover({ label, active, children }: { label: string; active?: boolean; children: React.ReactNode }) {
  return (
    <details className="group relative">
      <summary
        className={cx(
          "chip cursor-pointer list-none select-none whitespace-nowrap",
          active ? "border-brand-500 bg-brand-50 text-brand-700" : ""
        )}
      >
        {label}
        <ChevronDown size={13} className="transition group-open:rotate-180" />
      </summary>
      <div className="absolute z-30 mt-2 w-64 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100">
        {children}
      </div>
    </details>
  );
}

export default function FilterBar() {
  const { filters, patchFilters, resetFilters, autoSearch, setAutoSearch } = useMapSearch();

  const toggleArray = <K extends "property_type" | "room_type">(key: K, value: string) => {
    const current = (filters[key] as string[] | undefined) ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    patchFilters({ [key]: next.length ? next : undefined } as Partial<SearchFilters>);
  };

  const activeFilterCount = [
    filters.price_min,
    filters.price_max,
    filters.property_type?.length,
    filters.room_type?.length,
    filters.gender,
    filters.deposit_max,
    filters.available_only,
    filters.instant_booking,
    filters.verified_only,
    ...AMENITY_FILTERS.map((a) => filters[a.key as keyof SearchFilters]),
  ].filter(Boolean).length;

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 bg-white px-4 py-3 no-scrollbar">
      {/* Budget */}
      <Popover
        label={
          filters.price_min || filters.price_max
            ? `₹${filters.price_min ?? 0} – ${filters.price_max ?? "∞"}`
            : "Budget"
        }
        active={Boolean(filters.price_min || filters.price_max)}
      >
        <p className="mb-2 text-sm font-semibold">Monthly budget</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            className="input"
            value={filters.price_min ?? ""}
            onChange={(e) => patchFilters({ price_min: e.target.value ? +e.target.value : undefined })}
          />
          <span className="text-slate-400">–</span>
          <input
            type="number"
            placeholder="Max"
            className="input"
            value={filters.price_max ?? ""}
            onChange={(e) => patchFilters({ price_max: e.target.value ? +e.target.value : undefined })}
          />
        </div>
        <p className="mt-3 mb-1 text-sm font-semibold">Max deposit</p>
        <input
          type="number"
          placeholder="Any"
          className="input"
          value={filters.deposit_max ?? ""}
          onChange={(e) => patchFilters({ deposit_max: e.target.value ? +e.target.value : undefined })}
        />
      </Popover>

      {/* Property type */}
      <Popover label="Property type" active={Boolean(filters.property_type?.length)}>
        <div className="grid grid-cols-2 gap-2">
          {PROPERTY_TYPES.map((t) => {
            const on = filters.property_type?.includes(t.value as PropertyType);
            return (
              <button
                key={t.value}
                onClick={() => toggleArray("property_type", t.value)}
                className={cx("chip justify-center", on ? "border-brand-500 bg-brand-50 text-brand-700" : "")}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </Popover>

      {/* Room type */}
      <Popover label="Room type" active={Boolean(filters.room_type?.length)}>
        <div className="grid grid-cols-2 gap-2">
          {ROOM_TYPES.map((t) => {
            const on = filters.room_type?.includes(t.value as RoomType);
            return (
              <button
                key={t.value}
                onClick={() => toggleArray("room_type", t.value)}
                className={cx("chip justify-center", on ? "border-brand-500 bg-brand-50 text-brand-700" : "")}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </Popover>

      {/* Gender */}
      <Popover label="Gender" active={Boolean(filters.gender)}>
        <div className="space-y-1.5">
          {GENDERS.map((g) => (
            <button
              key={g.value}
              onClick={() =>
                patchFilters({ gender: filters.gender === g.value ? undefined : g.value })
              }
              className={cx(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm",
                filters.gender === g.value ? "bg-brand-50 text-brand-700" : "hover:bg-slate-50"
              )}
            >
              {g.label}
              {filters.gender === g.value && <Check size={15} />}
            </button>
          ))}
        </div>
      </Popover>

      {/* More filters */}
      <Popover
        label="More"
        active={
          Boolean(filters.instant_booking || filters.verified_only || filters.available_only) ||
          AMENITY_FILTERS.some((a) => filters[a.key as keyof SearchFilters])
        }
      >
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <SlidersHorizontal size={14} /> Amenities & more
        </p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {AMENITY_FILTERS.map((a) => (
            <label key={a.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
                checked={Boolean(filters[a.key as keyof SearchFilters])}
                onChange={(e) =>
                  patchFilters({ [a.key]: e.target.checked || undefined } as Partial<SearchFilters>)
                }
              />
              {a.label}
            </label>
          ))}
        </div>
        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
          {[
            { key: "verified_only", label: "Verified only" },
            { key: "instant_booking", label: "Instant booking" },
            { key: "available_only", label: "Available now" },
          ].map((o) => (
            <label key={o.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
                checked={Boolean(filters[o.key as keyof SearchFilters])}
                onChange={(e) =>
                  patchFilters({ [o.key]: e.target.checked || undefined } as Partial<SearchFilters>)
                }
              />
              {o.label}
            </label>
          ))}
        </div>
      </Popover>

      {activeFilterCount > 0 && (
        <button onClick={resetFilters} className="btn-ghost whitespace-nowrap px-3 py-1.5 text-xs">
          <RotateCcw size={13} /> Clear ({activeFilterCount})
        </button>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-xs font-medium text-slate-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600"
            checked={autoSearch}
            onChange={(e) => setAutoSearch(e.target.checked)}
          />
          Search as I move the map
        </label>
      </div>
    </div>
  );
}
