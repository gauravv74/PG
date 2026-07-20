import {
  Archive,
  ArrowUpDown,
  Armchair,
  BedDouble,
  BookOpen,
  Building2,
  Camera,
  Car,
  CookingPot,
  DoorOpen,
  Droplets,
  Dumbbell,
  Fan,
  Flame,
  Gamepad2,
  Lamp,
  Refrigerator,
  ShowerHead,
  Snowflake,
  Sparkles,
  Utensils,
  WashingMachine,
  Wifi,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type HostCategory = "pg" | "share_room";
export type Gender = "girls" | "boys" | "both";
export type SharingType = "single" | "double" | "triple" | "multiple";
export type SpaceType = "flat" | "room";

export const MIN_PHOTOS = 5;
export const MIN_VIDEOS = 2;

export const GENDER_OPTIONS: { value: Gender; label: string; emoji: string }[] = [
  { value: "girls", label: "Girls only", emoji: "👩" },
  { value: "boys", label: "Boys only", emoji: "👨" },
  { value: "both", label: "Shared by both", emoji: "🧑‍🤝‍🧑" },
];

export const SHARING_OPTIONS: { value: SharingType; label: string; sub: string }[] = [
  { value: "single", label: "Single bed", sub: "1 person per room" },
  { value: "double", label: "Double sharing", sub: "2 people per room" },
  { value: "triple", label: "Triple sharing", sub: "3 people per room" },
  { value: "multiple", label: "Multiple beds", sub: "Enter a custom count" },
];

export interface Amenity {
  key: string;
  label: string;
  icon: LucideIcon;
}

export const AMENITIES: Amenity[] = [
  { key: "wifi", label: "WiFi", icon: Wifi },
  { key: "ac", label: "AC", icon: Snowflake },
  { key: "cooler", label: "Cooler", icon: Wind },
  { key: "fan", label: "Fan", icon: Fan },
  { key: "ro_water", label: "RO Water", icon: Droplets },
  { key: "parking", label: "Parking", icon: Car },
  { key: "house_cleaning", label: "House Cleaning", icon: Sparkles },
  { key: "cctv", label: "CCTV", icon: Camera },
  { key: "pillow_mattress", label: "Pillow / Mattress", icon: BedDouble },
  { key: "cupboard", label: "Cupboard", icon: Archive },
  { key: "balcony", label: "Balcony", icon: DoorOpen },
  { key: "terrace", label: "Terrace", icon: Building2 },
  { key: "library", label: "Library", icon: BookOpen },
  { key: "mess", label: "Mess", icon: Utensils },
  { key: "kitchen", label: "Kitchen", icon: CookingPot },
  { key: "generator", label: "Generator", icon: Zap },
  { key: "laundry", label: "Laundry", icon: WashingMachine },
  { key: "hot_water", label: "Hot Water", icon: Flame },
  { key: "geyser", label: "Geyser", icon: ShowerHead },
  { key: "refrigerator", label: "Refrigerator", icon: Refrigerator },
  { key: "study_table", label: "Study Table", icon: Lamp },
  { key: "lift", label: "Lift", icon: ArrowUpDown },
  { key: "terrace_chair", label: "Terrace Chair", icon: Armchair },
  { key: "play_area", label: "Play Area", icon: Gamepad2 },
  { key: "gym", label: "Gym", icon: Dumbbell },
];

export const AMENITY_LABEL: Record<string, string> = Object.fromEntries(
  AMENITIES.map((a) => [a.key, a.label])
);

export interface NearbyPlace {
  id: string;
  name: string;
  distance: string;
}

export interface PgRoomConfig {
  id: string;
  sharing: SharingType;
  bedCount: number;
  price: number;
  includedAll: boolean;
  deposit: number;
}

export interface MediaItem {
  id: string;
  url: string;
  name: string;
}

export interface WizardData {
  category: HostCategory | null;
  location: {
    method: "current" | "search" | null;
    query: string;
    lat: number;
    lng: number;
    address: string;
    cityId: string;
    flatDetails: string;
    nearby: NearbyPlace[];
  };
  pgGender: Gender;
  rooms: PgRoomConfig[];
  share: {
    spaceType: SpaceType;
    gender: Gender;
    vacancies: number;
    rent: number;
    deposit: number;
  };
  photos: MediaItem[];
  videos: MediaItem[];
  amenities: string[];
  basic: {
    propertyName: string;
    ownerName: string;
    phone: string;
    email: string;
  };
  notes: string;
}

export const emptyPgRoom = (): PgRoomConfig => ({
  id: crypto.randomUUID(),
  sharing: "single",
  bedCount: 4,
  price: 8000,
  includedAll: true,
  deposit: 8000,
});

export const initialWizardData = (): WizardData => ({
  category: null,
  location: {
    method: null,
    query: "",
    lat: 18.5204,
    lng: 73.8567,
    address: "",
    cityId: "",
    flatDetails: "",
    nearby: [],
  },
  pgGender: "both",
  rooms: [emptyPgRoom()],
  share: {
    spaceType: "room",
    gender: "both",
    vacancies: 1,
    rent: 9000,
    deposit: 9000,
  },
  photos: [],
  videos: [],
  amenities: ["wifi", "fan", "parking"],
  basic: { propertyName: "", ownerName: "", phone: "", email: "" },
  notes: "",
});

export const occupancyFor = (r: PgRoomConfig): number =>
  r.sharing === "single" ? 1 : r.sharing === "double" ? 2 : r.sharing === "triple" ? 3 : r.bedCount;

export const roomTypeFor = (r: PgRoomConfig): string =>
  r.sharing === "single"
    ? "private"
    : r.sharing === "double"
      ? "twin_sharing"
      : r.sharing === "triple"
        ? "triple_sharing"
        : "shared";

export const sharingLabel = (r: PgRoomConfig): string =>
  r.sharing === "multiple"
    ? `${r.bedCount}-bed sharing`
    : SHARING_OPTIONS.find((s) => s.value === r.sharing)!.label;
