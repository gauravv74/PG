import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  ChevronDown,
  Headphones,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import {
  useBlogs,
  useFaqs,
  useStats,
  useTestimonials,
  useTopUniversities,
  useTrendingCities,
} from "@/api/hooks";

const CITY_FALLBACK =
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80";

export function TrendingCities() {
  const { data } = useTrendingCities();
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h2 className="section-title">Trending cities</h2>
      <p className="mt-1 text-sm text-slate-500">Where students are booking right now</p>
      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {(data ?? []).map((c) => (
          <Link
            key={c.id}
            to={`/search?city_id=${c.id}`}
            className="group relative overflow-hidden rounded-2xl"
          >
            <img
              src={c.image_url ?? CITY_FALLBACK}
              alt={c.name}
              loading="lazy"
              className="h-32 w-full object-cover transition duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-3 text-white">
              <p className="font-bold">{c.name}</p>
              <p className="text-xs text-white/80">{c.property_count} homes</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function TopUniversities() {
  const { data } = useTopUniversities();
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h2 className="section-title">Top universities</h2>
      <p className="mt-1 text-sm text-slate-500">Homes near the world's leading campuses</p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {(data ?? []).map((u) => (
          <Link
            key={u.id}
            to={`/search?university_id=${u.id}`}
            className="card flex items-center gap-3 p-4 transition hover:shadow-card"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Star size={18} />
            </span>
            <span className="line-clamp-2 text-sm font-semibold">{u.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function Stats() {
  const { data } = useStats();
  const items = [
    { label: "Verified homes", value: data?.properties ?? "—" },
    { label: "Cities", value: data?.cities ?? "—" },
    { label: "Universities", value: data?.universities ?? "—" },
    { label: "Students served", value: (data?.students_served ?? 0).toLocaleString() },
  ];
  return (
    <section className="bg-brand-600">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-12 sm:px-6 md:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="text-center text-white">
            <p className="text-3xl font-extrabold sm:text-4xl">{s.value}</p>
            <p className="mt-1 text-sm text-brand-100">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const REASONS = [
  { icon: BadgeCheck, title: "Verified listings", body: "Every property is inspected and quality-scored before it goes live." },
  { icon: Wallet, title: "Price match promise", body: "Found it cheaper elsewhere? We'll match the price, guaranteed." },
  { icon: ShieldCheck, title: "Secure payments", body: "Deposits protected and refunded per transparent policies." },
  { icon: Headphones, title: "24×7 support", body: "Real humans on email, WhatsApp, and chat whenever you need." },
];

export function WhyChooseUs() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h2 className="section-title">Why choose UniNest</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REASONS.map((r, i) => (
          <motion.div
            key={r.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="card p-6"
          >
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <r.icon size={22} />
            </span>
            <h3 className="mt-4 font-bold">{r.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{r.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function Testimonials() {
  const { data } = useTestimonials();
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="section-title">Loved by students worldwide</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {(data ?? []).map((t: any) => (
            <div key={t.id} className="card p-6">
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400" />
                ))}
              </div>
              <p className="mt-3 text-sm text-slate-700">“{t.quote}”</p>
              <div className="mt-4">
                <p className="text-sm font-semibold">{t.author_name}</p>
                <p className="text-xs text-slate-500">{t.author_role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Blogs() {
  const { data } = useBlogs();
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex items-end justify-between">
        <h2 className="section-title">From the blog</h2>
        <a href="#" className="text-sm font-semibold text-brand-600">
          View all
        </a>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {(data ?? []).map((b: any) => (
          <a key={b.id} href="#" className="card overflow-hidden transition hover:shadow-card">
            <img src={b.cover_image_url} alt={b.title} loading="lazy" className="h-44 w-full object-cover" />
            <div className="p-5">
              <p className="text-xs font-semibold text-brand-600">{b.read_minutes} min read</p>
              <h3 className="mt-1 font-bold">{b.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{b.excerpt}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export function Faqs() {
  const { data } = useFaqs();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h2 className="section-title text-center">Frequently asked questions</h2>
      <div className="mt-6 space-y-3">
        {(data ?? []).map((f: any) => (
          <div key={f.id} className="card overflow-hidden">
            <button
              onClick={() => setOpen(open === f.id ? null : f.id)}
              className="flex w-full items-center justify-between p-5 text-left"
            >
              <span className="font-semibold">{f.question}</span>
              <ChevronDown
                size={18}
                className={`transition ${open === f.id ? "rotate-180" : ""}`}
              />
            </button>
            {open === f.id && <p className="px-5 pb-5 text-sm text-slate-600">{f.answer}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function StudentDiscountBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-accent-500 to-accent-600 p-8 text-white sm:flex-row">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <Sparkles size={16} /> Student discount
          </p>
          <h3 className="mt-1 text-2xl font-extrabold">Get up to 10% off your first booking</h3>
          <p className="mt-1 text-white/85">Verify your student status and unlock exclusive offers.</p>
        </div>
        <Link to="/auth" className="btn bg-white px-6 text-accent-600 hover:bg-white/90">
          Claim offer
        </Link>
      </div>
    </section>
  );
}
