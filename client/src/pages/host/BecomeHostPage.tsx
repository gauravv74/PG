import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bed,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Home,
  MapPin,
  Navigation,
  PartyPopper,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useCities, useCreateProperty, type NewPropertyPayload } from "@/api/hooks";
import { useAuth } from "@/hooks/useAuth";
import { money } from "@/lib/format";
import {
  AMENITIES,
  AMENITY_LABEL,
  GENDER_OPTIONS,
  MIN_PHOTOS,
  MIN_VIDEOS,
  SHARING_OPTIONS,
  emptyPgRoom,
  initialWizardData,
  occupancyFor,
  roomTypeFor,
  sharingLabel,
  type Gender,
  type MediaItem,
  type PgRoomConfig,
  type WizardData,
} from "@/features/host/wizard/constants";
import {
  Counter,
  Field,
  MediaUploader,
  MoneyInput,
  OptionCard,
  SelectableTile,
  StepHeader,
} from "@/features/host/wizard/components";

type StepId =
  | "location"
  | "category"
  | "pgGender"
  | "pgRooms"
  | "share"
  | "media"
  | "amenities"
  | "basic"
  | "notes"
  | "preview";

const STEP_TITLES: Record<StepId, string> = {
  location: "Location",
  category: "Property type",
  pgGender: "PG type",
  pgRooms: "Rooms & pricing",
  share: "Space & pricing",
  media: "Photos & videos",
  amenities: "Amenities",
  basic: "Basic info",
  notes: "Notes",
  preview: "Preview",
};

function stepsFor(category: WizardData["category"]): StepId[] {
  if (category === "pg")
    return ["location", "category", "pgGender", "pgRooms", "media", "amenities", "basic", "notes", "preview"];
  if (category === "share_room")
    return ["location", "category", "share", "media", "amenities", "basic", "notes", "preview"];
  return ["location", "category"];
}

export default function BecomeHostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createProperty = useCreateProperty();

  const [data, setData] = useState<WizardData>(initialWizardData);
  const [stepIndex, setStepIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const steps = useMemo(() => stepsFor(data.category), [data.category]);
  const current = steps[Math.min(stepIndex, steps.length - 1)];
  const progress = ((stepIndex + 1) / steps.length) * 100;

  function patch(p: Partial<WizardData>) {
    setData((d) => ({ ...d, ...p }));
  }

  const valid = useMemo(() => stepValid(current, data), [current, data]);

  function next() {
    if (current === "preview") return submit();
    setDir(1);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }
  function back() {
    if (stepIndex === 0) return navigate(-1);
    setDir(-1);
    setStepIndex((i) => Math.max(i - 1, 0));
  }
  function goTo(id: StepId) {
    const idx = steps.indexOf(id);
    if (idx >= 0) {
      setDir(idx < stepIndex ? -1 : 1);
      setStepIndex(idx);
    }
  }

  async function submit() {
    setError("");
    try {
      await createProperty.mutateAsync(buildPayload(data));
      setDone(true);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Something went wrong while submitting. Please try again.");
    }
  }

  if (done) return <DoneScreen name={data.basic.propertyName} onDashboard={() => navigate("/host")} />;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Progress bar */}
      <div className="sticky top-16 z-30 h-1.5 w-full bg-slate-100">
        <motion.div
          className="h-full rounded-r-full bg-brand-600"
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <button onClick={back} className="btn-ghost !px-2">
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">{stepIndex === 0 ? "Exit" : "Back"}</span>
        </button>
        <span className="text-sm font-semibold text-slate-500">
          Step {stepIndex + 1} of {steps.length} · {STEP_TITLES[current]}
        </span>
        <button onClick={() => navigate(-1)} className="btn-ghost !px-2 text-slate-400">
          <X size={18} />
        </button>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-32 sm:px-6">
        <motion.div
            key={current}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            {current === "location" && <LocationStep data={data} patch={patch} />}
            {current === "category" && <CategoryStep data={data} patch={patch} />}
            {current === "pgGender" && (
              <GenderStep
                title="Who is this PG for?"
                subtitle="Pick the residents you want to host."
                value={data.pgGender}
                onChange={(g) => patch({ pgGender: g })}
              />
            )}
            {current === "pgRooms" && <PgRoomsStep data={data} patch={patch} />}
            {current === "share" && <ShareStep data={data} patch={patch} />}
            {current === "media" && <MediaStep data={data} patch={patch} />}
            {current === "amenities" && <AmenitiesStep data={data} patch={patch} />}
            {current === "basic" && <BasicInfoStep data={data} patch={patch} user={user?.email} />}
            {current === "notes" && <NotesStep data={data} patch={patch} />}
            {current === "preview" && <PreviewStep data={data} goTo={goTo} />}
          </motion.div>

        {error && <p className="mt-4 rounded-xl bg-accent-500/10 p-3 text-sm text-accent-600">{error}</p>}
      </div>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <button onClick={back} className="btn-outline">
            <ChevronLeft size={16} /> Back
          </button>
          <button
            onClick={next}
            disabled={!valid || createProperty.isPending}
            className="btn-primary min-w-40"
          >
            {current === "preview" ? (
              createProperty.isPending ? (
                "Submitting…"
              ) : (
                <>
                  <Check size={16} /> Confirm & submit
                </>
              )
            ) : (
              <>
                Continue <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Step: Location ----------------------------- */
function LocationStep({ data, patch }: StepProps) {
  const { data: cities } = useCities();
  const loc = data.location;

  function setLoc(p: Partial<WizardData["location"]>) {
    patch({ location: { ...loc, ...p } });
  }

  function useCurrent() {
    if (!navigator.geolocation) {
      setLoc({ method: "current", address: "Current location", nearby: sampleNearby() });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLoc({
          method: "current",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: loc.address || "Pinned to your current location",
          nearby: loc.nearby.length ? loc.nearby : sampleNearby(),
        }),
      () => setLoc({ method: "current", address: loc.address || "Current location", nearby: sampleNearby() })
    );
  }

  return (
    <div>
      <StepHeader
        eyebrow="Let's start"
        title="Where is your place located?"
        subtitle="Use your current location or search for the address. You can fine-tune the details below."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <OptionCard
          icon={Navigation}
          title="Use current location"
          subtitle="Detect via GPS"
          selected={loc.method === "current"}
          onClick={useCurrent}
        />
        <OptionCard
          icon={Search}
          title="Search by location"
          subtitle="Type your address"
          selected={loc.method === "search"}
          onClick={() => setLoc({ method: "search" })}
        />
      </div>

      {loc.method && (
        <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          {loc.method === "search" && (
            <Field label="Search address">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-9"
                  placeholder="Area, street, landmark…"
                  value={loc.query}
                  onChange={(e) => setLoc({ query: e.target.value, address: e.target.value })}
                />
              </div>
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City">
              <select className="input" value={loc.cityId} onChange={(e) => setLoc({ cityId: e.target.value })}>
                <option value="">Select a city…</option>
                {(cities ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}, {c.country}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Full address" hint="confirm details">
              <input
                className="input"
                placeholder="House / flat, street"
                value={loc.address}
                onChange={(e) => setLoc({ address: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Flat / building details" hint="floor, block, etc.">
            <input
              className="input"
              placeholder="e.g. 2nd floor, B-wing, Green Residency"
              value={loc.flatDetails}
              onChange={(e) => setLoc({ flatDetails: e.target.value })}
            />
          </Field>

          <NearbyEditor value={loc.nearby} onChange={(nearby) => setLoc({ nearby })} />
        </div>
      )}
    </div>
  );
}

function NearbyEditor({
  value,
  onChange,
}: {
  value: WizardData["location"]["nearby"];
  onChange: (v: WizardData["location"]["nearby"]) => void;
}) {
  const [name, setName] = useState("");
  const [distance, setDistance] = useState("");

  function add() {
    if (!name.trim()) return;
    onChange([...value, { id: crypto.randomUUID(), name: name.trim(), distance: distance.trim() || "nearby" }]);
    setName("");
    setDistance("");
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">Nearby places</span>
      <div className="flex flex-wrap gap-2">
        {value.map((n) => (
          <span key={n.id} className="chip">
            <MapPin size={12} className="text-brand-500" /> {n.name} · {n.distance}
            <button onClick={() => onChange(value.filter((x) => x.id !== n.id))} className="text-slate-400 hover:text-accent-600">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className="input flex-1"
          placeholder="e.g. Metro station"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
        />
        <input
          className="input w-28"
          placeholder="500 m"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
        />
        <button type="button" onClick={add} className="btn-outline shrink-0">
          <Plus size={16} /> Add
        </button>
      </div>
    </div>
  );
}

/* ----------------------------- Step: Category ----------------------------- */
function CategoryStep({ data, patch }: StepProps) {
  return (
    <div>
      <StepHeader
        eyebrow="Property type"
        title="Which best describes your property?"
        subtitle="This decides the details we'll ask for next."
      />
      <div className="grid gap-4">
        <OptionCard
          icon={Building2}
          title="PG (Paying Guest)"
          subtitle="Managed rooms with beds, meals & shared facilities"
          selected={data.category === "pg"}
          onClick={() => patch({ category: "pg" })}
        />
        <OptionCard
          icon={Users}
          title="Share your room"
          subtitle="Rent out a spare room or flat with vacancies"
          selected={data.category === "share_room"}
          onClick={() => patch({ category: "share_room" })}
        />
      </div>
    </div>
  );
}

/* ----------------------------- Step: Gender ----------------------------- */
function GenderStep({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: Gender;
  onChange: (g: Gender) => void;
}) {
  return (
    <div>
      <StepHeader eyebrow="Residents" title={title} subtitle={subtitle} />
      <div className="grid gap-3 sm:grid-cols-3">
        {GENDER_OPTIONS.map((g) => (
          <OptionCard
            key={g.value}
            emoji={g.emoji}
            title={g.label}
            selected={value === g.value}
            onClick={() => onChange(g.value)}
          />
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Step: PG Rooms ----------------------------- */
function PgRoomsStep({ data, patch }: StepProps) {
  function setRoom(id: string, p: Partial<PgRoomConfig>) {
    patch({ rooms: data.rooms.map((r) => (r.id === id ? { ...r, ...p } : r)) });
  }
  return (
    <div>
      <StepHeader
        eyebrow="Rooms & pricing"
        title="Set up your room types"
        subtitle="Add each sharing type you offer, with its price and deposit."
      />
      <div className="space-y-5">
        {data.rooms.map((room, i) => (
          <div key={room.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-bold text-slate-900">Room type {i + 1}</p>
              {data.rooms.length > 1 && (
                <button
                  onClick={() => patch({ rooms: data.rooms.filter((r) => r.id !== room.id) })}
                  className="btn-ghost !px-2 text-accent-600"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <p className="mb-2 text-sm font-semibold text-slate-700">Sharing type</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SHARING_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setRoom(room.id, { sharing: s.value })}
                  className={`rounded-xl border-2 px-3 py-2.5 text-left transition ${
                    room.sharing === s.value
                      ? "border-brand-600 bg-brand-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="block text-sm font-bold text-slate-900">{s.label}</span>
                  <span className="block text-xs text-slate-500">{s.sub}</span>
                </button>
              ))}
            </div>

            {room.sharing === "multiple" && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-semibold text-slate-700">Number of beds</span>
                <Counter value={room.bedCount} min={4} max={20} onChange={(v) => setRoom(room.id, { bedCount: v })} />
              </div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Price / month">
                <MoneyInput value={room.price} onChange={(v) => setRoom(room.id, { price: v })} />
              </Field>
              <Field label="Deposit amount">
                <MoneyInput value={room.deposit} onChange={(v) => setRoom(room.id, { deposit: v })} />
              </Field>
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
                checked={room.includedAll}
                onChange={(e) => setRoom(room.id, { includedAll: e.target.checked })}
              />
              <span className="text-sm font-medium text-slate-700">
                All bills & services included in this price (electricity, food, WiFi…)
              </span>
            </label>
          </div>
        ))}
      </div>

      <button
        onClick={() => patch({ rooms: [...data.rooms, emptyPgRoom()] })}
        className="btn-outline mt-4 w-full"
      >
        <Plus size={16} /> Add another room type
      </button>
    </div>
  );
}

/* ----------------------------- Step: Share room ----------------------------- */
function ShareStep({ data, patch }: StepProps) {
  const s = data.share;
  function setShare(p: Partial<WizardData["share"]>) {
    patch({ share: { ...s, ...p } });
  }
  return (
    <div>
      <StepHeader
        eyebrow="Space & pricing"
        title="Tell us about the space"
        subtitle="What are you sharing, and for whom?"
      />

      <p className="mb-2 text-sm font-semibold text-slate-700">Space type</p>
      <div className="mb-6 grid grid-cols-2 gap-3">
        <SelectableTile icon={Home} label="Flat" selected={s.spaceType === "flat"} onClick={() => setShare({ spaceType: "flat" })} />
        <SelectableTile icon={Bed} label="Room" selected={s.spaceType === "room"} onClick={() => setShare({ spaceType: "room" })} />
      </div>

      <p className="mb-2 text-sm font-semibold text-slate-700">Who is it for?</p>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {GENDER_OPTIONS.map((g) => (
          <OptionCard key={g.value} emoji={g.emoji} title={g.label} selected={s.gender === g.value} onClick={() => setShare({ gender: g.value })} />
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">How many vacancies?</span>
          <Counter value={s.vacancies} min={1} max={20} onChange={(v) => setShare({ vacancies: v })} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Rent / month">
            <MoneyInput value={s.rent} onChange={(v) => setShare({ rent: v })} />
          </Field>
          <Field label="Deposit amount">
            <MoneyInput value={s.deposit} onChange={(v) => setShare({ deposit: v })} />
          </Field>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Step: Media ----------------------------- */
function MediaStep({ data, patch }: StepProps) {
  function addMedia(kind: "photos" | "videos", files: FileList) {
    const items: MediaItem[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(f),
      name: f.name,
    }));
    patch({ [kind]: [...data[kind], ...items] } as Partial<WizardData>);
  }
  function removeMedia(kind: "photos" | "videos", id: string) {
    patch({ [kind]: data[kind].filter((m) => m.id !== id) } as Partial<WizardData>);
  }
  return (
    <div>
      <StepHeader
        eyebrow="Showcase"
        title="Add photos & videos"
        subtitle={`At least ${MIN_PHOTOS} photos and ${MIN_VIDEOS} videos are required — add as many as you like.`}
      />
      <div className="space-y-8">
        <MediaUploader
          kind="photo"
          items={data.photos}
          min={MIN_PHOTOS}
          onAdd={(f) => addMedia("photos", f)}
          onRemove={(id) => removeMedia("photos", id)}
        />
        <MediaUploader
          kind="video"
          items={data.videos}
          min={MIN_VIDEOS}
          onAdd={(f) => addMedia("videos", f)}
          onRemove={(id) => removeMedia("videos", id)}
        />
      </div>
    </div>
  );
}

/* ----------------------------- Step: Amenities ----------------------------- */
function AmenitiesStep({ data, patch }: StepProps) {
  function toggle(key: string) {
    patch({
      amenities: data.amenities.includes(key)
        ? data.amenities.filter((a) => a !== key)
        : [...data.amenities, key],
    });
  }
  return (
    <div>
      <StepHeader
        eyebrow="Facilities"
        title="What does your place offer?"
        subtitle={`${data.amenities.length} selected — tap to toggle.`}
      />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {AMENITIES.map((a) => (
          <SelectableTile
            key={a.key}
            icon={a.icon}
            label={a.label}
            selected={data.amenities.includes(a.key)}
            onClick={() => toggle(a.key)}
          />
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Step: Basic info ----------------------------- */
function BasicInfoStep({ data, patch, user }: StepProps & { user?: string }) {
  function setBasic(p: Partial<WizardData["basic"]>) {
    patch({ basic: { ...data.basic, ...p } });
  }
  return (
    <div>
      <StepHeader eyebrow="Almost there" title="Basic property information" subtitle="How guests and we can reach you." />
      <div className="grid gap-4">
        <Field label="Property name">
          <input
            className="input"
            placeholder="e.g. Green Nest PG"
            value={data.basic.propertyName}
            onChange={(e) => setBasic({ propertyName: e.target.value })}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Owner name">
            <input
              className="input"
              placeholder="Full name"
              value={data.basic.ownerName}
              onChange={(e) => setBasic({ ownerName: e.target.value })}
            />
          </Field>
          <Field label="Phone number">
            <input
              className="input"
              type="tel"
              placeholder="+91 98765 43210"
              value={data.basic.phone}
              onChange={(e) => setBasic({ phone: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Email">
          <input
            className="input"
            type="email"
            placeholder={user ?? "you@example.com"}
            value={data.basic.email}
            onChange={(e) => setBasic({ email: e.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}

/* ----------------------------- Step: Notes ----------------------------- */
function NotesStep({ data, patch }: StepProps) {
  return (
    <div>
      <StepHeader eyebrow="Anything else?" title="Add notes for guests" subtitle="House rules, timings, food preferences — anything worth knowing." />
      <textarea
        className="input min-h-40"
        placeholder="e.g. No smoking. Gate closes at 11 PM. Veg-only kitchen…"
        value={data.notes}
        onChange={(e) => patch({ notes: e.target.value })}
      />
    </div>
  );
}

/* ----------------------------- Step: Preview ----------------------------- */
function PreviewStep({ data, goTo }: { data: WizardData; goTo: (id: StepId) => void }) {
  const cover = data.photos[0]?.url;
  const isPg = data.category === "pg";
  const price = isPg
    ? Math.min(...data.rooms.map((r) => r.price))
    : data.share.rent;

  return (
    <div>
      <StepHeader eyebrow="Preview listing" title="Review before you submit" subtitle="Check everything looks right. Tap any section to edit." />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="relative aspect-[16/9] bg-slate-100">
          {cover ? (
            <img src={cover} alt="cover" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-slate-400">No photos added</div>
          )}
          <span className="absolute left-3 top-3 chip bg-white/90 capitalize">
            {isPg ? "PG" : "Shared space"}
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">{data.basic.propertyName || "Untitled property"}</h3>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                <MapPin size={14} /> {data.location.address || "No address"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-brand-700">{money(price, "INR")}</p>
              <p className="text-xs text-slate-400">from / month</p>
            </div>
          </div>

          {data.location.nearby.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {data.location.nearby.map((n) => (
                <span key={n.id} className="chip text-xs">
                  {n.name} · {n.distance}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <PreviewRow label="Location" onEdit={() => goTo("location")}>
          {data.location.address || "—"}
          {data.location.flatDetails && ` · ${data.location.flatDetails}`}
        </PreviewRow>

        {isPg ? (
          <>
            <PreviewRow label="PG type" onEdit={() => goTo("pgGender")}>
              {GENDER_OPTIONS.find((g) => g.value === data.pgGender)?.label}
            </PreviewRow>
            <PreviewRow label="Rooms" onEdit={() => goTo("pgRooms")}>
              <ul className="space-y-1">
                {data.rooms.map((r) => (
                  <li key={r.id} className="flex justify-between gap-4">
                    <span>
                      {sharingLabel(r)} {r.includedAll && <span className="text-emerald-600">· all incl.</span>}
                    </span>
                    <span className="font-semibold">
                      {money(r.price)}/mo · dep {money(r.deposit)}
                    </span>
                  </li>
                ))}
              </ul>
            </PreviewRow>
          </>
        ) : (
          <PreviewRow label="Space" onEdit={() => goTo("share")}>
            {data.share.spaceType} · {GENDER_OPTIONS.find((g) => g.value === data.share.gender)?.label} ·{" "}
            {data.share.vacancies} vacancy(s) · {money(data.share.rent)}/mo · dep {money(data.share.deposit)}
          </PreviewRow>
        )}

        <PreviewRow label="Media" onEdit={() => goTo("media")}>
          {data.photos.length} photos · {data.videos.length} videos
        </PreviewRow>
        <PreviewRow label="Amenities" onEdit={() => goTo("amenities")}>
          {data.amenities.length ? data.amenities.map((a) => AMENITY_LABEL[a]).join(", ") : "None selected"}
        </PreviewRow>
        <PreviewRow label="Contact" onEdit={() => goTo("basic")}>
          {data.basic.ownerName} · {data.basic.phone} · {data.basic.email}
        </PreviewRow>
        {data.notes && (
          <PreviewRow label="Notes" onEdit={() => goTo("notes")}>
            {data.notes}
          </PreviewRow>
        )}
      </div>

      <p className="mt-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-700">
        Submitting sends your listing to our team for verification before it goes live.
      </p>
    </div>
  );
}

function PreviewRow({ label, onEdit, children }: { label: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <div className="mt-1 text-sm text-slate-700">{children}</div>
      </div>
      <button onClick={onEdit} className="shrink-0 text-sm font-semibold text-brand-600 hover:underline">
        Edit
      </button>
    </div>
  );
}

/* ----------------------------- Done ----------------------------- */
function DoneScreen({ name, onDashboard }: { name: string; onDashboard: () => void }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] place-items-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md text-center"
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500 text-white">
          <PartyPopper size={28} />
        </div>
        <h1 className="mt-6 text-2xl font-extrabold">Listing submitted!</h1>
        <p className="mt-2 text-slate-500">
          {name ? `"${name}"` : "Your property"} has been sent for review. We'll notify you once it's verified and live.
        </p>
        <button onClick={onDashboard} className="btn-primary mt-6">
          Go to host dashboard
        </button>
      </motion.div>
    </div>
  );
}

/* ----------------------------- helpers ----------------------------- */
type StepProps = { data: WizardData; patch: (p: Partial<WizardData>) => void };

function sampleNearby(): WizardData["location"]["nearby"] {
  return [
    { id: crypto.randomUUID(), name: "Bus stop", distance: "300 m" },
    { id: crypto.randomUUID(), name: "Market", distance: "600 m" },
  ];
}

function stepValid(step: StepId, d: WizardData): boolean {
  switch (step) {
    case "location":
      return !!d.location.method && d.location.address.trim().length > 2 && !!d.location.cityId;
    case "category":
      return !!d.category;
    case "pgGender":
      return true;
    case "pgRooms":
      return d.rooms.length > 0 && d.rooms.every((r) => r.price > 0);
    case "share":
      return d.share.rent > 0 && d.share.vacancies > 0;
    case "media":
      return d.photos.length >= MIN_PHOTOS && d.videos.length >= MIN_VIDEOS;
    case "amenities":
      return d.amenities.length > 0;
    case "basic":
      return (
        d.basic.propertyName.trim().length > 2 &&
        d.basic.ownerName.trim().length > 1 &&
        d.basic.phone.trim().length >= 7 &&
        /.+@.+\..+/.test(d.basic.email)
      );
    case "notes":
      return true;
    case "preview":
      return true;
    default:
      return true;
  }
}

function buildPayload(d: WizardData): NewPropertyPayload {
  const isPg = d.category === "pg";
  const genderLabel = isPg
    ? GENDER_OPTIONS.find((g) => g.value === d.pgGender)?.label
    : GENDER_OPTIONS.find((g) => g.value === d.share.gender)?.label;

  const amenityText = d.amenities.map((a) => AMENITY_LABEL[a]).join(", ");
  const nearbyText = d.location.nearby.map((n) => `${n.name} (${n.distance})`).join(", ");

  const descriptionParts = [
    d.notes,
    d.location.flatDetails && `Flat details: ${d.location.flatDetails}`,
    nearbyText && `Nearby: ${nearbyText}`,
    amenityText && `Amenities: ${amenityText}`,
    `Contact: ${d.basic.ownerName} · ${d.basic.phone} · ${d.basic.email}`,
  ].filter(Boolean);

  const rooms: NewPropertyPayload["rooms"] = isPg
    ? d.rooms.map((r) => ({
        name: sharingLabel(r),
        room_type: roomTypeFor(r),
        base_price: r.price,
        security_deposit: r.deposit,
        cleaning_fee: 0,
        max_occupancy: occupancyFor(r),
        total_units: 1,
      }))
    : [
        {
          name: `${d.share.spaceType === "flat" ? "Flat" : "Room"} share`,
          room_type: d.share.spaceType === "flat" ? "apartment" : "shared",
          base_price: d.share.rent,
          security_deposit: d.share.deposit,
          cleaning_fee: 0,
          max_occupancy: d.share.vacancies,
          total_units: d.share.vacancies,
        },
      ];

  return {
    property: {
      name: d.basic.propertyName,
      property_type: isPg ? "pg" : "apartment",
      city_id: d.location.cityId,
      address: d.location.address,
      latitude: d.location.lat,
      longitude: d.location.lng,
      summary: `${isPg ? "PG" : "Shared space"} · ${genderLabel}`,
      description: descriptionParts.join("\n"),
      bills_included: isPg ? d.rooms.some((r) => r.includedAll) : false,
      instant_booking: false,
    },
    rooms,
    submit: true,
  };
}
