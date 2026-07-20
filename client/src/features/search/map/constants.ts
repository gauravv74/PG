import type { MapSort } from "@/types";

/** Default map center (Pune) — matches the host wizard default. */
export const DEFAULT_CENTER = { lat: 18.5204, lng: 73.8567 };
export const DEFAULT_ZOOM = 12;

/** Debounce for viewport-driven refetch (spec: 300–500ms). */
export const MOVE_DEBOUNCE_MS = 400;

/**
 * A real Google Maps "Map ID" is required for Advanced Markers. Falls back to
 * Google's public demo id so the feature works out-of-the-box in dev.
 */
export const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

export const SORT_OPTIONS: { value: MapSort; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "lowest_price", label: "Price: Low to High" },
  { value: "highest_price", label: "Price: High to Low" },
  { value: "highest_rated", label: "Highest rated" },
  { value: "newest", label: "Newest" },
  { value: "nearest", label: "Nearest" },
  { value: "most_popular", label: "Most popular" },
];

export const PROPERTY_TYPES: { value: string; label: string }[] = [
  { value: "pg", label: "PG / Hostel" },
  { value: "pbsa", label: "Student Housing" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "private_hall", label: "Private Hall" },
  { value: "homestay", label: "Homestay" },
];

export const ROOM_TYPES: { value: string; label: string }[] = [
  { value: "shared", label: "Shared" },
  { value: "private", label: "Private" },
  { value: "twin_sharing", label: "Twin sharing" },
  { value: "triple_sharing", label: "Triple sharing" },
  { value: "ensuite", label: "Ensuite" },
  { value: "studio", label: "Studio" },
];

export const GENDERS: { value: string; label: string }[] = [
  { value: "female", label: "Girls" },
  { value: "male", label: "Boys" },
  { value: "any", label: "Co-ed" },
];

/** Amenity boolean filters (key must match SearchFilters + backend flags). */
export const AMENITY_FILTERS: { key: string; label: string }[] = [
  { key: "wifi", label: "WiFi" },
  { key: "ac", label: "AC" },
  { key: "parking", label: "Parking" },
  { key: "laundry", label: "Laundry" },
  { key: "study_table", label: "Study table" },
  { key: "gym", label: "Gym" },
  { key: "food_included", label: "Food included" },
  { key: "bills_included", label: "Bills included" },
];
