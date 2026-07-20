import { useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AlertTriangle, MapPinOff, RotateCw, SearchX } from "lucide-react";
import type { MapSort } from "@/types";
import { usePropertyList } from "@/api/hooks";
import { useMapSearch } from "./MapSearchContext";
import { SORT_OPTIONS } from "./constants";
import MapPropertyCard from "./MapPropertyCard";
import SkeletonCard from "./SkeletonCard";

export default function ListPanel() {
  const {
    queryFilters,
    filters,
    patchFilters,
    bounds,
    selectedId,
    selectedSource,
    hoveredId,
    selectProperty,
    hoverProperty,
  } = useMapSearch();

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = usePropertyList(queryFilters, Boolean(bounds));

  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  const scrollRef = useRef<HTMLDivElement>(null);
  const indexById = useMemo(
    () => new Map(items.map((p, i) => [p.id, i])),
    [items]
  );

  const virtualizer = useVirtualizer({
    count: hasNextPage ? items.length + 1 : items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 176,
    overscan: 6,
    gap: 12,
  });

  // Infinite scroll: fetch next page when the sentinel row is virtualized.
  const virtualItems = virtualizer.getVirtualItems();
  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1];
    if (!last) return;
    if (last.index >= items.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [virtualItems, items.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Marker → card: scroll selected card into view (only when initiated on the map).
  useEffect(() => {
    if (!selectedId || selectedSource !== "map") return;
    const idx = indexById.get(selectedId);
    if (idx != null) virtualizer.scrollToIndex(idx, { align: "center", behavior: "smooth" });
  }, [selectedId, selectedSource, indexById, virtualizer]);

  return (
    <div className="flex h-full flex-col">
      {/* Count + sort header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-semibold text-slate-700">
          {isLoading ? (
            "Searching this area…"
          ) : (
            <>
              Showing <span className="text-brand-700">{total.toLocaleString("en-IN")}</span>{" "}
              {total === 1 ? "property" : "properties"} in this area
            </>
          )}
        </p>
        <select
          value={filters.sort}
          onChange={(e) => patchFilters({ sort: e.target.value as MapSort })}
          className="input w-auto py-1.5 text-xs"
          aria-label="Sort results"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Scrollable list */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-4 py-4">
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState hasBounds={Boolean(bounds)} />
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
            {virtualItems.map((vi) => {
              const isSentinel = vi.index > items.length - 1;
              const p = items[vi.index];
              return (
                <div
                  key={isSentinel ? "sentinel" : p.id}
                  data-index={vi.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${vi.start}px)`,
                  }}
                >
                  {isSentinel ? (
                    <p className="py-4 text-center text-sm text-slate-400">
                      {isFetchingNextPage ? "Loading more…" : ""}
                    </p>
                  ) : (
                    <MapPropertyCard
                      property={p}
                      selected={selectedId === p.id}
                      hovered={hoveredId === p.id}
                      onSelect={() => selectProperty(p.id, "list")}
                      onHover={(h) => hoverProperty(h ? p.id : null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Silent background refresh indicator */}
        {isFetching && !isLoading && !isFetchingNextPage && (
          <div className="pointer-events-none sticky bottom-2 mx-auto w-max rounded-full bg-slate-900/80 px-3 py-1 text-xs text-white">
            Updating results…
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ hasBounds }: { hasBounds: boolean }) {
  return (
    <div className="grid h-full place-items-center px-6 text-center">
      <div>
        {hasBounds ? (
          <SearchX className="mx-auto mb-3 text-slate-300" size={40} />
        ) : (
          <MapPinOff className="mx-auto mb-3 text-slate-300" size={40} />
        )}
        <p className="font-semibold text-slate-700">
          {hasBounds ? "No properties in this area" : "Move the map to start searching"}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {hasBounds
            ? "Try zooming out, panning the map, or relaxing your filters."
            : "Pan or zoom the map and we'll show matching homes here."}
        </p>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid h-full place-items-center px-6 text-center">
      <div>
        <AlertTriangle className="mx-auto mb-3 text-amber-400" size={40} />
        <p className="font-semibold text-slate-700">Something went wrong</p>
        <p className="mt-1 text-sm text-slate-500">
          We couldn't load properties. Check your connection and try again.
        </p>
        <button onClick={onRetry} className="btn-outline mx-auto mt-4">
          <RotateCw size={16} /> Retry
        </button>
      </div>
    </div>
  );
}
