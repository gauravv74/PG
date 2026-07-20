import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { APIProvider } from "@vis.gl/react-google-maps";
import { List, MapIcon, KeyRound } from "lucide-react";
import type { MapBounds, SearchFilters } from "@/types";
import { cx } from "@/lib/format";
import { MapSearchProvider, useMapSearch } from "@/features/search/map/MapSearchContext";
import FilterBar from "@/features/search/map/FilterBar";
import ListPanel from "@/features/search/map/ListPanel";
import MapPanel from "@/features/search/map/MapPanel";
import { DEFAULT_CENTER } from "@/features/search/map/constants";

const ARRAY_KEYS = new Set(["room_type", "property_type"]);
const NUMBER_KEYS = new Set(["price_min", "price_max", "deposit_max", "max_distance_km", "lat", "lng"]);
const BOOL_KEYS = new Set([
  "wifi",
  "ac",
  "parking",
  "laundry",
  "gym",
  "study_table",
  "food_included",
  "bills_included",
  "instant_booking",
  "verified_only",
  "available_only",
]);

function parseFilters(params: URLSearchParams): SearchFilters {
  const f: SearchFilters = {};
  params.forEach((value, key) => {
    if (ARRAY_KEYS.has(key)) {
      (f as any)[key] = [...((f as any)[key] ?? []), value];
    } else if (NUMBER_KEYS.has(key)) {
      (f as any)[key] = Number(value);
    } else if (BOOL_KEYS.has(key)) {
      (f as any)[key] = value === "true";
    } else {
      (f as any)[key] = value;
    }
  });
  return f;
}

/** A wide fallback viewport so the list works even without a Maps API key. */
const FALLBACK_BOUNDS: MapBounds = {
  north: DEFAULT_CENTER.lat + 0.15,
  south: DEFAULT_CENTER.lat - 0.15,
  east: DEFAULT_CENTER.lng + 0.15,
  west: DEFAULT_CENTER.lng - 0.15,
};

export default function MapSearchPage() {
  const [params] = useSearchParams();
  const initialFilters = useMemo(() => parseFilters(params), [params]);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <MapSearchProvider initialFilters={initialFilters}>
      {apiKey ? (
        <APIProvider apiKey={apiKey} libraries={["marker"]}>
          <Layout hasMap />
        </APIProvider>
      ) : (
        <Layout hasMap={false} />
      )}
    </MapSearchProvider>
  );
}

function Layout({ hasMap }: { hasMap: boolean }) {
  const { commitBounds, bounds } = useMapSearch();
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  // Without a Google key there is no map to derive bounds from — seed a wide
  // viewport so the list panel still returns results.
  useEffect(() => {
    if (!hasMap && !bounds) commitBounds(FALLBACK_BOUNDS);
  }, [hasMap, bounds, commitBounds]);

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col bg-white">
      <FilterBar />

      <div className="relative flex flex-1 overflow-hidden">
        {/* List column */}
        <section
          className={cx(
            "w-full border-r border-slate-100 lg:w-[44%] xl:w-[40%]",
            mobileView === "map" ? "hidden lg:block" : "block"
          )}
        >
          <ListPanel />
        </section>

        {/* Map column */}
        <section
          className={cx(
            "relative flex-1",
            mobileView === "list" ? "hidden lg:block" : "block"
          )}
        >
          {hasMap ? <MapPanel /> : <NoKeyNotice />}
        </section>

        {/* Mobile list/map toggle */}
        {hasMap && (
          <button
            onClick={() => setMobileView((v) => (v === "list" ? "map" : "list"))}
            className="btn-primary fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full shadow-card lg:hidden"
          >
            {mobileView === "list" ? (
              <>
                <MapIcon size={16} /> Map
              </>
            ) : (
              <>
                <List size={16} /> List
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function NoKeyNotice() {
  return (
    <div className="grid h-full place-items-center bg-slate-50 p-8 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <KeyRound size={26} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Map needs a Google Maps API key</h3>
        <p className="mt-2 text-sm text-slate-500">
          Add <code className="rounded bg-slate-100 px-1.5 py-0.5">VITE_GOOGLE_MAPS_API_KEY</code>{" "}
          to <code className="rounded bg-slate-100 px-1.5 py-0.5">client/.env</code> and restart the
          dev server. The property list on the left works in the meantime.
        </p>
      </div>
    </div>
  );
}
