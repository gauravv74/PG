import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Map as MapIcon } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import FilterSidebar from "@/features/search/FilterSidebar";
import { useSearch } from "@/api/hooks";
import type { SearchFilters } from "@/types";

const SORTS = [
  { key: "most_popular", label: "Most popular" },
  { key: "lowest_price", label: "Lowest price" },
  { key: "highest_price", label: "Highest price" },
  { key: "highest_rated", label: "Highest rated" },
  { key: "newest", label: "Newest" },
  { key: "closest", label: "Closest" },
];

export default function SearchPage() {
  const [params] = useSearchParams();
  const initial = useMemo<SearchFilters>(() => {
    const f: SearchFilters = {};
    params.forEach((value, key) => {
      if (key === "room_type" || key === "property_type") {
        (f as any)[key] = [...((f as any)[key] ?? []), value];
      } else if (["price_min", "price_max", "max_distance_km"].includes(key)) {
        (f as any)[key] = Number(value);
      } else if (["wifi", "gym", "bills_included", "instant_booking", "verified_only"].includes(key)) {
        (f as any)[key] = value === "true";
      } else {
        (f as any)[key] = value;
      }
    });
    return f;
  }, [params]);

  const [filters, setFilters] = useState<SearchFilters>({ sort: "most_popular", ...initial });
  useEffect(() => setFilters((f) => ({ ...f, ...initial })), [initial]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useSearch(filters);
  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  // Infinite scroll (Module 16)
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const patch = (p: Partial<SearchFilters>) => setFilters((f) => ({ ...f, ...p }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <FilterSidebar filters={filters} onChange={patch} />

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {isLoading ? "Searching…" : `${total} homes found`}
              {filters.query ? ` for “${filters.query}”` : ""}
            </p>
            <div className="flex items-center gap-2">
              <Link
                to={{ pathname: "/map", search: params.toString() }}
                className="btn-outline whitespace-nowrap"
              >
                <MapIcon size={16} /> View on map
              </Link>
              <select
                value={filters.sort}
                onChange={(e) => patch({ sort: e.target.value })}
                className="input w-auto"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {items.length === 0 && !isLoading ? (
            <div className="card grid place-items-center p-16 text-center text-slate-400">
              No homes match your filters. Try widening your search.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}

          <div ref={sentinel} className="h-12" />
          {isFetchingNextPage && (
            <p className="py-4 text-center text-sm text-slate-400">Loading more…</p>
          )}
        </div>
      </div>
    </div>
  );
}
