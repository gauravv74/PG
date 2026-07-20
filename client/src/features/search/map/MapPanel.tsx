import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Map as GoogleMap, useMap } from "@vis.gl/react-google-maps";
import Supercluster from "supercluster";
import { Search, Loader2 } from "lucide-react";
import type { MapBounds, MapPin } from "@/types";
import { useMapPins } from "@/api/hooks";
import { useMapSearch } from "./MapSearchContext";
import { DEFAULT_CENTER, DEFAULT_ZOOM, MAP_ID, MOVE_DEBOUNCE_MS } from "./constants";
import PriceMarker from "./PriceMarker";
import ClusterMarker from "./ClusterMarker";
import MarkerPopup from "./MarkerPopup";

type Viewport = { bounds: MapBounds; zoom: number };

/** GeoJSON feature returned by supercluster (cluster or single point). */
type ClusterFeature = {
  id?: number;
  geometry: { coordinates: [number, number] };
  properties: { cluster: boolean; pinId?: string; point_count?: number };
};

function boundsFromMap(map: google.maps.Map): MapBounds | null {
  const b = map.getBounds();
  if (!b) return null;
  const ne = b.getNorthEast();
  const sw = b.getSouthWest();
  return { north: ne.lat(), east: ne.lng(), south: sw.lat(), west: sw.lng() };
}

export default function MapPanel() {
  const map = useMap();
  const {
    queryFilters,
    commitBounds,
    autoSearch,
    selectedId,
    selectedSource,
    hoveredId,
    selectProperty,
    hoverProperty,
  } = useMapSearch();

  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [dirty, setDirty] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const initialized = useRef(false);

  const { data, isFetching } = useMapPins(queryFilters, queryFilters.north != null);
  const pins = data?.items ?? [];

  // ---- Viewport handling: commit bounds (debounced) or reveal "search area" ----
  const handleIdle = useCallback(() => {
    if (!map) return;
    const b = boundsFromMap(map);
    const zoom = map.getZoom() ?? DEFAULT_ZOOM;
    if (!b) return;
    setViewport({ bounds: b, zoom });

    if (!initialized.current) {
      initialized.current = true;
      commitBounds(b); // first load always searches the initial viewport
      return;
    }
    if (autoSearch) {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        commitBounds(b);
        setDirty(false);
      }, MOVE_DEBOUNCE_MS);
    } else {
      setDirty(true);
    }
  }, [map, autoSearch, commitBounds]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  const searchThisArea = () => {
    if (!map) return;
    const b = boundsFromMap(map);
    if (b) {
      commitBounds(b);
      setDirty(false);
    }
  };

  // ---- Pan to selection coming from the list panel ----
  useEffect(() => {
    if (!map || !selectedId || selectedSource !== "list") return;
    const pin = pins.find((p) => p.id === selectedId);
    if (pin) {
      map.panTo({ lat: pin.latitude, lng: pin.longitude });
      if ((map.getZoom() ?? 0) < 14) map.setZoom(14);
    }
  }, [map, selectedId, selectedSource, pins]);

  // ---- Clustering ----
  const index = useMemo(() => {
    const sc = new Supercluster({ radius: 64, maxZoom: 18 });
    sc.load(
      pins.map((p) => ({
        type: "Feature" as const,
        properties: { cluster: false, pinId: p.id },
        geometry: { type: "Point" as const, coordinates: [p.longitude, p.latitude] },
      }))
    );
    return sc;
  }, [pins]);

  const clusters = useMemo<ClusterFeature[]>(() => {
    if (!viewport) return [];
    const { west, south, east, north } = viewport.bounds;
    return index.getClusters([west, south, east, north], Math.round(viewport.zoom)) as unknown as ClusterFeature[];
  }, [index, viewport]);

  const pinById = useMemo(() => new Map(pins.map((p) => [p.id, p])), [pins]);
  const visibleIds = useMemo(
    () =>
      new Set(
        clusters.filter((c) => !c.properties.cluster).map((c) => c.properties.pinId as string)
      ),
    [clusters]
  );

  const activeId = hoveredId ?? selectedId;
  const activePin: MapPin | undefined =
    activeId && visibleIds.has(activeId) ? pinById.get(activeId) : undefined;

  const expandCluster = (clusterId: number, lng: number, lat: number) => {
    if (!map) return;
    const zoom = Math.min(index.getClusterExpansionZoom(clusterId), 18);
    map.panTo({ lat, lng });
    map.setZoom(zoom);
  };

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapId={MAP_ID}
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling="greedy"
        disableDefaultUI={false}
        clickableIcons={false}
        onIdle={handleIdle}
        className="h-full w-full"
        reuseMaps
      >
        {clusters.map((c) => {
          const [lng, lat] = c.geometry.coordinates;
          if (c.properties.cluster) {
            return (
              <ClusterMarker
                key={`cluster-${c.id}`}
                lat={lat}
                lng={lng}
                count={c.properties.point_count ?? 0}
                onClick={() => expandCluster(c.id as number, lng, lat)}
              />
            );
          }
          const pin = pinById.get(c.properties.pinId as string);
          if (!pin) return null;
          return (
            <PriceMarker
              key={pin.id}
              pin={pin}
              selected={selectedId === pin.id}
              hovered={hoveredId === pin.id}
              onSelect={() => selectProperty(pin.id, "map")}
              onHover={(h) => hoverProperty(h ? pin.id : null)}
            />
          );
        })}

        {activePin && <MarkerPopup pin={activePin} onHover={(h) => hoverProperty(h ? activePin.id : null)} />}
      </GoogleMap>

      {/* Search-this-area button (shown when auto-search is off and the map moved) */}
      {dirty && !autoSearch && (
        <button
          onClick={searchThisArea}
          className="btn-primary absolute left-1/2 top-4 -translate-x-1/2 rounded-full shadow-card"
        >
          {isFetching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Search this area
        </button>
      )}

      {/* Refetch indicator */}
      {isFetching && (
        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-soft backdrop-blur">
          <Loader2 size={14} className="animate-spin" /> Updating map…
        </div>
      )}
    </div>
  );
}
