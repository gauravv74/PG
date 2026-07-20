export type RoomType =
  | "shared"
  | "private"
  | "ensuite"
  | "studio"
  | "apartment"
  | "entire_house"
  | "twin_sharing"
  | "triple_sharing";

export type PropertyType = "pbsa" | "private_hall" | "apartment" | "house" | "pg" | "homestay";

export interface PropertyCard {
  id: string;
  name: string;
  slug: string;
  property_type: PropertyType;
  city_id: string;
  summary?: string | null;
  cover_image_url?: string | null;
  min_price?: number | null;
  currency: string;
  avg_rating: number;
  review_count: number;
  latitude: number;
  longitude: number;
  is_verified: boolean;
  is_featured: boolean;
  instant_booking: boolean;
}

export interface Room {
  id: string;
  name: string;
  room_type: RoomType;
  description?: string | null;
  base_price: number;
  currency: string;
  security_deposit: number;
  cleaning_fee: number;
  max_occupancy: number;
  total_units: number;
  size_sqft?: number | null;
  gender_policy: string;
  has_private_bathroom: boolean;
  has_kitchen: boolean;
  has_ac: boolean;
  floor_plan_url?: string | null;
}

export interface PropertyImage {
  id: string;
  url: string;
  caption?: string | null;
  is_cover: boolean;
  sort_order: number;
}

export interface NearbyPOI {
  poi_type: string;
  name: string;
  distance_km: number;
  walking_minutes?: number | null;
}

export interface PropertyDetail extends PropertyCard {
  description?: string | null;
  address: string;
  video_tour_url?: string | null;
  tour_360_url?: string | null;
  floor_plan_url?: string | null;
  bills_included: boolean;
  flexible_cancellation: boolean;
  view_count: number;
  images: PropertyImage[];
  rooms: Room[];
  pois: NearbyPOI[];
  offers: { id: string; title: string; discount_percent?: number | null }[];
  policies: { policy_type: string; title: string; content: string }[];
}

export interface City {
  id: string;
  name: string;
  slug: string;
  country: string;
  image_url?: string | null;
  is_trending: boolean;
  property_count: number;
}

export interface University {
  id: string;
  name: string;
  slug: string;
  city_id: string;
  logo_url?: string | null;
  is_top: boolean;
  latitude: number;
  longitude: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "host" | "admin" | "support";
  avatar_url?: string | null;
  is_email_verified: boolean;
  loyalty_points: number;
}

export interface SearchFilters {
  city_id?: string;
  university_id?: string;
  query?: string;
  price_min?: number;
  price_max?: number;
  room_type?: RoomType[];
  property_type?: PropertyType[];
  gender?: string;
  bills_included?: boolean;
  wifi?: boolean;
  gym?: boolean;
  laundry?: boolean;
  parking?: boolean;
  ac?: boolean;
  instant_booking?: boolean;
  verified_only?: boolean;
  max_distance_km?: number;
  sort?: string;
  page?: number;
  page_size?: number;
}
