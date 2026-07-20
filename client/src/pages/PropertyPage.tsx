import { useParams } from "react-router-dom";
import { useState } from "react";
import {
  BadgeCheck,
  Bath,
  Bus,
  Calendar,
  Cross,
  Heart,
  MapPin,
  Share2,
  ShoppingCart,
  Star,
  Train,
  Utensils,
  Wifi,
} from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import { useProperty, useSimilar } from "@/api/hooks";
import { money } from "@/lib/format";
import type { Room } from "@/types";

const POI_ICON: Record<string, any> = {
  metro: Train,
  bus_stop: Bus,
  grocery: ShoppingCart,
  restaurant: Utensils,
  hospital: Cross,
};

export default function PropertyPage() {
  const { slug = "" } = useParams();
  const { data: p, isLoading } = useProperty(slug);
  const { data: similar } = useSimilar(slug);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  if (isLoading || !p)
    return <div className="p-16 text-center text-slate-400">Loading property…</div>;

  const gallery = p.images?.length ? p.images : [{ id: "0", url: p.cover_image_url ?? "" }];
  const room = selectedRoom ?? p.rooms?.[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{p.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <Star size={15} className="fill-amber-400 text-amber-400" />
              {p.avg_rating.toFixed(1)} ({p.review_count} reviews)
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={15} /> {p.address}
            </span>
            {p.is_verified && (
              <span className="chip text-brand-700">
                <BadgeCheck size={13} /> Verified
              </span>
            )}
          </div>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button className="btn-outline">
            <Share2 size={16} /> Share
          </button>
          <button className="btn-outline">
            <Heart size={16} /> Save
          </button>
        </div>
      </div>

      {/* Gallery */}
      <div className="mt-4 grid gap-2 overflow-hidden rounded-3xl sm:grid-cols-4 sm:grid-rows-2">
        <img
          src={gallery[0].url}
          alt={p.name}
          className="h-64 w-full object-cover sm:col-span-2 sm:row-span-2 sm:h-full"
        />
        {gallery.slice(1, 5).map((img) => (
          <img key={img.id} src={img.url} alt="" className="hidden h-full w-full object-cover sm:block" />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {p.tour_360_url && <span className="chip">360° Tour</span>}
        {p.video_tour_url && <span className="chip">Video Tour</span>}
        {p.floor_plan_url && <span className="chip">Floor Plan</span>}
        {p.bills_included && <span className="chip text-emerald-700">Bills included</span>}
        {p.flexible_cancellation && <span className="chip text-emerald-700">Flexible cancellation</span>}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="section-title">About this home</h2>
            <p className="mt-2 text-slate-600">{p.description ?? p.summary}</p>
          </section>

          <section>
            <h2 className="section-title">Room types</h2>
            <div className="mt-3 space-y-3">
              {p.rooms?.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoom(r)}
                  className={`card flex w-full items-center justify-between p-4 text-left transition ${
                    room?.id === r.id ? "ring-2 ring-brand-400" : ""
                  }`}
                >
                  <div>
                    <p className="font-semibold capitalize">{r.name}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="capitalize">{r.room_type.replace("_", " ")}</span>
                      {r.has_private_bathroom && (
                        <span className="flex items-center gap-1">
                          <Bath size={12} /> Private bath
                        </span>
                      )}
                      {r.has_ac && <span>AC</span>}
                      <span>Sleeps {r.max_occupancy}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{money(r.base_price, r.currency)}</p>
                    <p className="text-xs text-slate-500">/ month</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="section-title">What's nearby</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {p.pois?.map((poi, i) => {
                const Icon = POI_ICON[poi.poi_type] ?? MapPin;
                return (
                  <div key={i} className="card flex items-center gap-3 p-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{poi.name}</p>
                      <p className="text-xs text-slate-500">
                        {poi.distance_km} km · {poi.walking_minutes} min walk
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="section-title">Policies</h2>
            <div className="mt-3 space-y-2">
              {p.policies?.length ? (
                p.policies.map((pol, i) => (
                  <div key={i} className="card p-4">
                    <p className="font-semibold">{pol.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{pol.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Standard cancellation and deposit policies apply.</p>
              )}
            </div>
          </section>
        </div>

        {/* Booking card */}
        <div>
          <div className="card sticky top-20 p-5">
            <p className="text-sm text-slate-500">From</p>
            <p className="text-2xl font-extrabold">
              {money(room?.base_price ?? p.min_price, p.currency)}
              <span className="text-sm font-normal text-slate-500"> / month</span>
            </p>
            <div className="mt-4 space-y-2">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
                <Calendar size={16} className="text-slate-400" />
                <input type="date" className="w-full bg-transparent py-2.5 text-sm outline-none" />
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
                <Calendar size={16} className="text-slate-400" />
                <input type="date" className="w-full bg-transparent py-2.5 text-sm outline-none" />
              </label>
            </div>
            <button className="btn-primary mt-4 w-full">
              {p.instant_booking ? "Instant book" : "Request to book"}
            </button>
            <button className="btn-outline mt-2 w-full">
              <Wifi size={16} /> Contact host
            </button>
            <p className="mt-3 text-center text-xs text-slate-400">
              You won't be charged yet · Secure payment
            </p>
          </div>
        </div>
      </div>

      {(similar?.length ?? 0) > 0 && (
        <section className="mt-12">
          <h2 className="section-title">Similar homes</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar!.map((s) => (
              <PropertyCard key={s.id} property={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
