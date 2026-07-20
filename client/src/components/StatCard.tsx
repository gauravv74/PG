import type { LucideIcon } from "lucide-react";

export default function StatCard({
  icon: Icon,
  label,
  value,
  accent = "brand",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: "brand" | "emerald" | "amber" | "accent";
}) {
  const colors: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    accent: "bg-accent-500/10 text-accent-600",
  };
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className={`grid h-12 w-12 place-items-center rounded-xl ${colors[accent]}`}>
        <Icon size={22} />
      </span>
      <div>
        <p className="text-2xl font-extrabold">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}
