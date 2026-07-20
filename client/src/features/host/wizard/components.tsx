import { useRef } from "react";
import { ImagePlus, Minus, Plus, Video, X, type LucideIcon } from "lucide-react";
import { cx } from "@/lib/format";
import type { MediaItem } from "./constants";

export function StepHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="mb-2 text-sm font-semibold text-brand-600">{eyebrow}</p>}
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-2 max-w-xl text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function OptionCard({
  icon: Icon,
  emoji,
  title,
  subtitle,
  selected,
  onClick,
}: {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  subtitle?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "group flex w-full items-center gap-4 rounded-2xl border-2 p-5 text-left transition",
        selected
          ? "border-brand-600 bg-brand-50 shadow-card"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-soft"
      )}
    >
      <span
        className={cx(
          "grid h-12 w-12 shrink-0 place-items-center rounded-xl text-xl transition",
          selected ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
        )}
      >
        {emoji ? <span>{emoji}</span> : Icon ? <Icon size={22} /> : null}
      </span>
      <span className="min-w-0">
        <span className="block font-bold text-slate-900">{title}</span>
        {subtitle && <span className="block text-sm text-slate-500">{subtitle}</span>}
      </span>
    </button>
  );
}

export function SelectableTile({
  icon: Icon,
  label,
  selected,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-center transition",
        selected
          ? "border-brand-600 bg-brand-50 text-brand-700 shadow-card"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
      )}
    >
      <Icon size={22} className={selected ? "text-brand-600" : "text-slate-400"} />
      <span className="text-xs font-semibold leading-tight">{label}</span>
    </button>
  );
}

export function Counter({
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="inline-flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-2 py-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 disabled:opacity-30"
      >
        <Minus size={16} />
      </button>
      <span className="min-w-6 text-center text-base font-bold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 disabled:opacity-30"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function MoneyInput({
  value,
  onChange,
  placeholder,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
        ₹
      </span>
      <input
        type="number"
        min={0}
        placeholder={placeholder}
        value={value || ""}
        onChange={(e) => onChange(+e.target.value)}
        className="input pl-7"
      />
    </div>
  );
}

export function MediaUploader({
  kind,
  items,
  min,
  onAdd,
  onRemove,
}: {
  kind: "photo" | "video";
  items: MediaItem[];
  min: number;
  onAdd: (files: FileList) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isPhoto = kind === "photo";
  const done = items.length >= min;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold text-slate-900">
          {isPhoto ? "Photos" : "Videos"}
          <span className="ml-2 text-sm font-medium text-slate-400">
            {items.length}/{min} minimum
          </span>
        </h3>
        <span
          className={cx(
            "chip",
            done ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
          )}
        >
          {done ? "Requirement met" : `Add ${min - items.length} more`}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={isPhoto ? "image/*" : "video/*"}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onAdd(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {items.map((m) => (
          <div key={m.id} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {isPhoto ? (
              <img src={m.url} alt={m.name} className="h-full w-full object-cover" />
            ) : (
              <video src={m.url} className="h-full w-full object-cover" muted />
            )}
            <button
              type="button"
              onClick={() => onRemove(m.id)}
              className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
            >
              <X size={13} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-brand-400 hover:text-brand-600"
        >
          {isPhoto ? <ImagePlus size={22} /> : <Video size={22} />}
          <span className="text-xs font-semibold">Add</span>
        </button>
      </div>
    </div>
  );
}
