import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Trash2, X } from "lucide-react";
import { useCities, useCreateProperty, type NewPropertyPayload } from "@/api/hooks";
import { money } from "@/lib/format";

const PROPERTY_TYPES = ["pbsa", "private_hall", "apartment", "house", "pg", "homestay"];
const ROOM_TYPES = [
  "shared",
  "private",
  "ensuite",
  "studio",
  "apartment",
  "entire_house",
  "twin_sharing",
  "triple_sharing",
];

type RoomForm = {
  name: string;
  room_type: string;
  base_price: number;
  security_deposit: number;
  cleaning_fee: number;
  max_occupancy: number;
  total_units: number;
};

const emptyRoom = (): RoomForm => ({
  name: "",
  room_type: "studio",
  base_price: 12000,
  security_deposit: 12000,
  cleaning_fee: 1500,
  max_occupancy: 1,
  total_units: 1,
});

const STEPS = ["Details", "Rooms", "Review"];

export default function AddPropertyModal({ onClose }: { onClose: () => void }) {
  const { data: cities } = useCities();
  const createProperty = useCreateProperty();

  const [step, setStep] = useState(0);
  const [details, setDetails] = useState({
    name: "",
    property_type: "apartment",
    city_id: "",
    address: "",
    latitude: 18.5204,
    longitude: 73.8567,
    summary: "",
    description: "",
    bills_included: true,
    instant_booking: false,
  });
  const [rooms, setRooms] = useState<RoomForm[]>([emptyRoom()]);
  const [error, setError] = useState("");

  const detailsValid =
    details.name.trim().length > 2 && details.city_id && details.address.trim().length > 3;
  const roomsValid = rooms.length > 0 && rooms.every((r) => r.name.trim() && r.base_price > 0);

  function setD<K extends keyof typeof details>(key: K, value: (typeof details)[K]) {
    setDetails((d) => ({ ...d, [key]: value }));
  }
  function setRoom(i: number, patch: Partial<RoomForm>) {
    setRooms((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function submit(asDraft: boolean) {
    setError("");
    const payload: NewPropertyPayload = {
      property: { ...details },
      rooms,
      submit: !asDraft,
    };
    try {
      await createProperty.mutateAsync(payload);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Failed to create property. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white"
      >
        {/* Header + stepper */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-extrabold">Add a property</h2>
          <button onClick={onClose} className="btn-ghost !px-2">
            <X size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2 px-6 py-4">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                  i < step
                    ? "bg-emerald-500 text-white"
                    : i === step
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </span>
              <span className={`text-sm font-medium ${i === step ? "text-slate-900" : "text-slate-400"}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && <div className="h-px flex-1 bg-slate-100" />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-3"
              >
                <Field label="Property name">
                  <input
                    className="input"
                    placeholder="e.g. Riverside Student Living"
                    value={details.name}
                    onChange={(e) => setD("name", e.target.value)}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Property type">
                    <select
                      className="input capitalize"
                      value={details.property_type}
                      onChange={(e) => setD("property_type", e.target.value)}
                    >
                      {PROPERTY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="City">
                    <select
                      className="input"
                      value={details.city_id}
                      onChange={(e) => setD("city_id", e.target.value)}
                    >
                      <option value="">Select a city…</option>
                      {(cities ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}, {c.country}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Address">
                  <input
                    className="input"
                    placeholder="Street address"
                    value={details.address}
                    onChange={(e) => setD("address", e.target.value)}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Latitude">
                    <input
                      type="number"
                      step="any"
                      className="input"
                      value={details.latitude}
                      onChange={(e) => setD("latitude", +e.target.value)}
                    />
                  </Field>
                  <Field label="Longitude">
                    <input
                      type="number"
                      step="any"
                      className="input"
                      value={details.longitude}
                      onChange={(e) => setD("longitude", +e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Summary">
                  <input
                    className="input"
                    placeholder="One-line highlight"
                    value={details.summary}
                    onChange={(e) => setD("summary", e.target.value)}
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    className="input min-h-20"
                    placeholder="Describe the property, location and community…"
                    value={details.description}
                    onChange={(e) => setD("description", e.target.value)}
                  />
                </Field>
                <div className="flex gap-4">
                  <Toggle
                    label="Bills included"
                    checked={details.bills_included}
                    onChange={(v) => setD("bills_included", v)}
                  />
                  <Toggle
                    label="Instant booking"
                    checked={details.instant_booking}
                    onChange={(v) => setD("instant_booking", v)}
                  />
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="rooms"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-4"
              >
                {rooms.map((room, i) => (
                  <div key={i} className="card p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-semibold">Room {i + 1}</p>
                      {rooms.length > 1 && (
                        <button
                          onClick={() => setRooms((rs) => rs.filter((_, idx) => idx !== i))}
                          className="btn-ghost !px-2 text-accent-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Room name">
                        <input
                          className="input"
                          placeholder="e.g. Deluxe Studio"
                          value={room.name}
                          onChange={(e) => setRoom(i, { name: e.target.value })}
                        />
                      </Field>
                      <Field label="Room type">
                        <select
                          className="input capitalize"
                          value={room.room_type}
                          onChange={(e) => setRoom(i, { room_type: e.target.value })}
                        >
                          {ROOM_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Price / month">
                        <input
                          type="number"
                          className="input"
                          value={room.base_price}
                          onChange={(e) => setRoom(i, { base_price: +e.target.value })}
                        />
                      </Field>
                      <Field label="Security deposit">
                        <input
                          type="number"
                          className="input"
                          value={room.security_deposit}
                          onChange={(e) => setRoom(i, { security_deposit: +e.target.value })}
                        />
                      </Field>
                      <Field label="Cleaning fee">
                        <input
                          type="number"
                          className="input"
                          value={room.cleaning_fee}
                          onChange={(e) => setRoom(i, { cleaning_fee: +e.target.value })}
                        />
                      </Field>
                      <Field label="Units available">
                        <input
                          type="number"
                          min={1}
                          className="input"
                          value={room.total_units}
                          onChange={(e) => setRoom(i, { total_units: +e.target.value })}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setRooms((rs) => [...rs, emptyRoom()])}
                  className="btn-outline w-full"
                >
                  <Plus size={16} /> Add another room type
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-4"
              >
                <div className="card p-4">
                  <p className="text-xs font-semibold uppercase text-slate-400">Property</p>
                  <p className="mt-1 text-lg font-bold">{details.name}</p>
                  <p className="text-sm text-slate-500 capitalize">
                    {details.property_type.replace("_", " ")} ·{" "}
                    {cities?.find((c) => c.id === details.city_id)?.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{details.address}</p>
                  <div className="mt-2 flex gap-2">
                    {details.bills_included && <span className="chip">Bills included</span>}
                    {details.instant_booking && <span className="chip">Instant booking</span>}
                  </div>
                </div>
                <div className="card p-4">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    {rooms.length} room type{rooms.length > 1 ? "s" : ""}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {rooms.map((r, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span className="capitalize">
                          {r.name || `Room ${i + 1}`} · {r.room_type.replace("_", " ")} · {r.total_units} units
                        </span>
                        <span className="font-semibold">{money(r.base_price)}/mo</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                  Submitting sends your listing for admin verification. You can also save it as a
                  draft and submit later.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {error && <p className="mt-3 text-sm text-accent-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <button
            onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
            className="btn-ghost"
          >
            {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < 2 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={(step === 0 && !detailsValid) || (step === 1 && !roomsValid)}
              className="btn-primary"
            >
              Continue
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => submit(true)}
                disabled={createProperty.isPending}
                className="btn-outline"
              >
                Save draft
              </button>
              <button
                onClick={() => submit(false)}
                disabled={createProperty.isPending}
                className="btn-primary"
              >
                {createProperty.isPending ? "Publishing…" : "Submit for review"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-brand-600"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
