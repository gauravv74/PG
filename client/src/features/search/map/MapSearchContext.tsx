import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MapBounds, SearchFilters } from "@/types";

type SelectSource = "list" | "map" | null;

interface MapSearchValue {
  /** User filters + sort (no viewport). */
  filters: SearchFilters;
  patchFilters: (patch: Partial<SearchFilters>) => void;
  resetFilters: () => void;

  /** The committed viewport that queries run against. */
  bounds: MapBounds | null;
  commitBounds: (b: MapBounds) => void;

  /** Combined query payload (filters + committed bounds). */
  queryFilters: SearchFilters;

  /** Cross-panel selection + hover sync. */
  selectedId: string | null;
  selectedSource: SelectSource;
  hoveredId: string | null;
  selectProperty: (id: string | null, source: Exclude<SelectSource, null>) => void;
  hoverProperty: (id: string | null) => void;

  /** "Search as I move the map" toggle. */
  autoSearch: boolean;
  setAutoSearch: (v: boolean) => void;
}

const Ctx = createContext<MapSearchValue | null>(null);

export function MapSearchProvider({
  children,
  initialFilters,
}: {
  children: ReactNode;
  initialFilters: SearchFilters;
}) {
  const [filters, setFilters] = useState<SearchFilters>({
    sort: "recommended",
    ...initialFilters,
  });
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<SelectSource>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [autoSearch, setAutoSearch] = useState(true);

  const patchFilters = useCallback((patch: Partial<SearchFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters((f) => ({ sort: f.sort, query: f.query, city_id: f.city_id }));
  }, []);

  const commitBounds = useCallback((b: MapBounds) => setBounds(b), []);

  const selectProperty = useCallback(
    (id: string | null, source: Exclude<SelectSource, null>) => {
      setSelectedId(id);
      setSelectedSource(id ? source : null);
    },
    []
  );

  const hoverProperty = useCallback((id: string | null) => setHoveredId(id), []);

  const queryFilters = useMemo<SearchFilters>(
    () => ({ ...filters, ...(bounds ?? {}) }),
    [filters, bounds]
  );

  const value = useMemo<MapSearchValue>(
    () => ({
      filters,
      patchFilters,
      resetFilters,
      bounds,
      commitBounds,
      queryFilters,
      selectedId,
      selectedSource,
      hoveredId,
      selectProperty,
      hoverProperty,
      autoSearch,
      setAutoSearch,
    }),
    [
      filters,
      patchFilters,
      resetFilters,
      bounds,
      commitBounds,
      queryFilters,
      selectedId,
      selectedSource,
      hoveredId,
      selectProperty,
      hoverProperty,
      autoSearch,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMapSearch(): MapSearchValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMapSearch must be used within MapSearchProvider");
  return ctx;
}
