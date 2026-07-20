import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Building2, CalendarCheck, Percent, TrendingUp, Users } from "lucide-react";
import { api } from "@/api/client";
import StatCard from "@/components/StatCard";
import { money } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";

const TABS = [
  "Dashboard",
  "Revenue",
  "Bookings",
  "Properties",
  "Add Property",
  "Calendar",
  "Messages",
  "Reviews",
  "Analytics",
  "Payments",
  "Leads",
  "Promotions",
];

export default function HostDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["host-dashboard"],
    queryFn: async () => (await api.get("/host/dashboard")).data,
    enabled: user?.role === "host" || user?.role === "admin",
  });
  const { data: properties } = useQuery({
    queryKey: ["host-properties"],
    queryFn: async () => (await api.get("/host/properties")).data,
    enabled: user?.role === "host" || user?.role === "admin",
  });

  if (!user || (user.role !== "host" && user.role !== "admin"))
    return <div className="p-16 text-center text-slate-400">Host access required.</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Host dashboard</h1>
        <button className="btn-primary" onClick={() => navigate("/become-a-host")}>
          + Add property
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={TrendingUp} label="Revenue" value={money(data?.revenue, "INR")} accent="emerald" />
        <StatCard icon={CalendarCheck} label="Bookings" value={data?.bookings ?? 0} />
        <StatCard icon={Percent} label="Occupancy" value={`${data?.occupancy_rate ?? 0}%`} accent="amber" />
        <StatCard icon={Building2} label="Properties" value={data?.properties ?? 0} />
        <StatCard icon={Users} label="Active leads" value={data?.active_leads ?? 0} accent="accent" />
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

      <div className="card mt-6 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-4">Property</th>
              <th className="p-4">Status</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Views</th>
              <th className="p-4">From</th>
            </tr>
          </thead>
          <tbody>
            {(properties ?? []).map((p: any) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4">
                  <span className="chip capitalize">{p.status}</span>
                </td>
                <td className="p-4">{p.avg_rating?.toFixed?.(1) ?? "—"}</td>
                <td className="p-4">{p.view_count}</td>
                <td className="p-4">{money(p.min_price, "INR")}</td>
              </tr>
            ))}
            {(!properties || properties.length === 0) && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400">
                  No properties yet. Add your first listing to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
