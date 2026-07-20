import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./client";
import type {
  City,
  MapResponse,
  Page,
  PropertyCard,
  PropertyDetail,
  PropertyListCard,
  SearchFilters,
  University,
} from "@/types";

// ---------- Discovery (Module 1) ----------
export const useTrendingCities = () =>
  useQuery({
    queryKey: ["trending-cities"],
    queryFn: async () => (await api.get<City[]>("/discovery/trending-cities")).data,
  });

export const useFeatured = () =>
  useQuery({
    queryKey: ["featured"],
    queryFn: async () => (await api.get<PropertyCard[]>("/discovery/featured-properties")).data,
  });

export const useRecommended = () =>
  useQuery({
    queryKey: ["recommended"],
    queryFn: async () => (await api.get<PropertyCard[]>("/discovery/recommended")).data,
  });

export const useTopUniversities = () =>
  useQuery({
    queryKey: ["top-universities"],
    queryFn: async () => (await api.get<University[]>("/discovery/top-universities")).data,
  });

export const useSpecialOffers = () =>
  useQuery({
    queryKey: ["special-offers"],
    queryFn: async () => (await api.get<PropertyCard[]>("/discovery/special-offers")).data,
  });

export const useRecentlyViewed = () =>
  useQuery({
    queryKey: ["recently-viewed"],
    queryFn: async () => (await api.get<PropertyCard[]>("/discovery/recently-viewed")).data,
  });

export const useTestimonials = () =>
  useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => (await api.get("/discovery/testimonials")).data,
  });

export const useStats = () =>
  useQuery({ queryKey: ["stats"], queryFn: async () => (await api.get("/discovery/stats")).data });

export const useBlogs = () =>
  useQuery({ queryKey: ["blogs"], queryFn: async () => (await api.get("/discovery/blogs")).data });

export const useFaqs = () =>
  useQuery({ queryKey: ["faqs"], queryFn: async () => (await api.get("/discovery/faqs")).data });

// ---------- Search (Module 2, infinite scroll — Module 16) ----------
export function toParams(filters: SearchFilters) {
  const p = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (typeof v === "boolean" && !v) return; // omit falsey flags
    if (Array.isArray(v)) v.forEach((x) => p.append(k, String(x)));
    else p.append(k, String(v));
  });
  return p;
}

export const useSearch = (filters: SearchFilters) =>
  useInfiniteQuery({
    queryKey: ["search", filters],
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const params = toParams({ ...filters, page: pageParam as number });
      return (await api.get<Page<PropertyCard>>(`/search?${params.toString()}`, { signal })).data;
    },
    getNextPageParam: (last) => (last.has_next ? last.page + 1 : undefined),
  });

// ---------- Map search (synchronized list + markers) ----------

/**
 * Lightweight markers for the current viewport. `enabled` lets callers hold off
 * until a bounding box is known. Request cancellation is automatic: TanStack
 * Query aborts the in-flight axios request (via `signal`) whenever the query key
 * changes (pan/zoom/filter), so only the latest viewport wins.
 */
export const useMapPins = (filters: SearchFilters, enabled = true) =>
  useQuery({
    queryKey: ["map-pins", filters],
    enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData, // keep old markers visible while refetching
    queryFn: async ({ signal }) => {
      const params = toParams(filters);
      return (await api.get<MapResponse>(`/properties/map?${params.toString()}`, { signal })).data;
    },
  });

/** Paginated rich cards for the list panel (infinite scroll + cancellation). */
export const usePropertyList = (filters: SearchFilters, enabled = true) =>
  useInfiniteQuery({
    queryKey: ["property-list", filters],
    enabled,
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    queryFn: async ({ pageParam, signal }) => {
      const params = toParams({ ...filters, page: pageParam as number });
      return (await api.get<Page<PropertyListCard>>(`/properties?${params.toString()}`, { signal }))
        .data;
    },
    getNextPageParam: (last) => (last.has_next ? last.page + 1 : undefined),
  });

// ---------- Property detail (Module 3) ----------
export const useProperty = (slug: string) =>
  useQuery({
    queryKey: ["property", slug],
    queryFn: async () => (await api.get<PropertyDetail>(`/properties/${slug}`)).data,
    enabled: !!slug,
  });

export const useSimilar = (slug: string) =>
  useQuery({
    queryKey: ["similar", slug],
    queryFn: async () => (await api.get<PropertyDetail[]>(`/properties/${slug}/similar`)).data,
    enabled: !!slug,
  });

// ---------- AI (Module 13) ----------
export const useParseSearch = () =>
  useMutation({
    mutationFn: async (query: string) =>
      (await api.post<SearchFilters>("/ai/parse-search", { query })).data,
  });

// ---------- Booking (Module 5) ----------
export const useQuote = () =>
  useMutation({
    mutationFn: async (payload: {
      room_id: string;
      check_in: string;
      check_out: string;
      coupon_code?: string;
    }) => (await api.post("/bookings/quote", payload)).data,
  });

// ---------- Host: cities + create property (Module 7) ----------
export const useCities = () =>
  useQuery({
    queryKey: ["cities"],
    queryFn: async () => (await api.get<City[]>("/discovery/cities")).data,
  });

export interface NewPropertyPayload {
  property: {
    name: string;
    property_type: string;
    city_id: string;
    address: string;
    latitude: number;
    longitude: number;
    summary?: string;
    description?: string;
    bills_included: boolean;
    instant_booking: boolean;
  };
  rooms: Array<{
    name: string;
    room_type: string;
    base_price: number;
    security_deposit: number;
    cleaning_fee: number;
    max_occupancy: number;
    total_units: number;
  }>;
  submit: boolean;
}

export const useCreateProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NewPropertyPayload) => {
      const { data: created } = await api.post("/properties", payload.property);
      for (const room of payload.rooms) {
        await api.post(`/properties/${created.id}/rooms`, room);
      }
      if (payload.submit) {
        await api.post(`/properties/${created.id}/submit`);
      }
      return created;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["host-properties"] });
      qc.invalidateQueries({ queryKey: ["host-dashboard"] });
    },
  });
};
