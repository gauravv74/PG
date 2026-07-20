import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Building2, DollarSign, Flag, ShieldCheck, Users } from "lucide-react";
import { api } from "@/api/client";
import StatCard from "@/components/StatCard";
import { money } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";

const TABS = [
  "Overview",
  "Users",
  "Hosts",
  "Properties",
  "Bookings",
  "Cities",
  "Universities",
  "Amenities",
  "Reviews",
  "Coupons",
  "Reports",
  "CMS",
  "Support",
  "Revenue",
  "Commission",
  "Moderation",
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => (await api.get("/admin/overview")).data,
    enabled: user?.role === "admin",
  });

  if (user?.role !== "admin")
    return <div className="p-16 text-center text-slate-400">Admin access required.</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold">Admin control center</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Users" value={data?.users ?? 0} />
        <StatCard icon={Building2} label="Properties" value={data?.properties ?? 0} />
        <StatCard icon={DollarSign} label="GMV" value={money(data?.gmv, "INR")} accent="emerald" />
        <StatCard icon={DollarSign} label="Commission" value={money(data?.commission_revenue, "INR")} accent="amber" />
        <StatCard icon={Users} label="Hosts" value={data?.hosts ?? 0} />
        <StatCard icon={ShieldCheck} label="Pending verifications" value={data?.pending_verifications ?? 0} accent="accent" />
        <StatCard icon={Flag} label="Flagged reviews" value={data?.flagged_reviews ?? 0} accent="accent" />
        <StatCard icon={BadgeCheck} label="Bookings" value={data?.bookings ?? 0} />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {TABS.map((t, i) => (
          <button
            key={t}
            className={`chip ${i === 0 ? "border-brand-500 bg-brand-50 text-brand-700" : ""}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="card mt-6 grid place-items-center p-16 text-center text-slate-400">
        Moderate listings & reviews, verify hosts, manage CMS, and track revenue & commission here.
      </div>
    </div>
  );
}
