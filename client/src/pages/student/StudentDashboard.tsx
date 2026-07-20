import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Gift, Heart, Star } from "lucide-react";
import { api } from "@/api/client";
import StatCard from "@/components/StatCard";
import { useAuth } from "@/hooks/useAuth";

const TABS = [
  "Dashboard",
  "Bookings",
  "Wishlist",
  "Messages",
  "Notifications",
  "Saved Searches",
  "Payment History",
  "Documents",
  "Reviews",
  "Support Tickets",
  "Referral Rewards",
  "Coupons",
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: async () => (await api.get("/students/dashboard")).data,
    enabled: !!user,
  });

  if (!user)
    return <div className="p-16 text-center text-slate-400">Please sign in to view your dashboard.</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold">Hi, {user.full_name.split(" ")[0]} 👋</h1>
      <p className="text-slate-500">Here's what's happening with your bookings.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Active bookings" value={data?.active_bookings ?? 0} />
        <StatCard icon={Heart} label="Wishlist" value={data?.wishlist_count ?? 0} accent="accent" />
        <StatCard icon={Star} label="Loyalty points" value={data?.loyalty_points ?? 0} accent="amber" />
        <StatCard icon={Gift} label="Referral code" value={data?.referral_code ?? "—"} accent="emerald" />
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
        Select a tab to manage your bookings, documents, payments, and rewards.
      </div>
    </div>
  );
}
