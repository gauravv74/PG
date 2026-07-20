import { motion } from "framer-motion";
import { MapPin, School, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParseSearch } from "@/api/hooks";

type Mode = "city" | "university" | "area" | "property";

const MODES: { key: Mode; label: string }[] = [
  { key: "city", label: "City" },
  { key: "university", label: "University" },
  { key: "area", label: "Area" },
  { key: "property", label: "Property Name" },
];

export default function HeroSearch() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("city");
  const [term, setTerm] = useState("");
  const [aiMode, setAiMode] = useState(false);
  const parse = useParseSearch();

  async function submit() {
    if (aiMode && term.trim()) {
      const filters = await parse.mutateAsync(term);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v == null) return;
        if (Array.isArray(v)) v.forEach((x) => params.append(k, String(x)));
        else params.append(k, String(v));
      });
      navigate(`/search?${params.toString()}`);
      return;
    }
    const params = new URLSearchParams({ query: term });
    navigate(`/search?${params.toString()}`);
  }

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl"
        >
          Find your perfect student home
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-3 max-w-2xl text-base text-brand-50/90 sm:text-lg"
        >
          Verified accommodation near 5,000+ universities. Book online in minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-8 max-w-3xl rounded-3xl bg-white p-3 shadow-card"
        >
          <div className="mb-2 flex items-center justify-between px-2">
            <div className="flex flex-wrap gap-1">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => {
                    setMode(m.key);
                    setAiMode(false);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    mode === m.key && !aiMode
                      ? "bg-brand-600 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setAiMode((v) => !v)}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                aiMode ? "bg-accent-500 text-white" : "text-accent-600 hover:bg-accent-500/10"
              }`}
            >
              <Sparkles size={13} /> AI Search
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 px-4">
              {aiMode ? (
                <Sparkles size={18} className="text-accent-500" />
              ) : mode === "university" ? (
                <School size={18} className="text-slate-400" />
              ) : (
                <MapPin size={18} className="text-slate-400" />
              )}
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder={
                  aiMode
                    ? "Try: studio under ₹15,000 near Pune University"
                    : `Search by ${mode}…`
                }
                className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={submit}
              disabled={parse.isPending}
              className="btn-primary h-[52px] px-6 text-base"
            >
              <Search size={18} /> {parse.isPending ? "Thinking…" : "Search"}
            </button>
          </div>
        </motion.div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-white/80">
          <span>Popular:</span>
          {["Pune", "London", "Bengaluru", "Melbourne", "Mumbai"].map((c) => (
            <button
              key={c}
              onClick={() => navigate(`/search?query=${c}`)}
              className="rounded-full bg-white/15 px-3 py-1 hover:bg-white/25"
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
