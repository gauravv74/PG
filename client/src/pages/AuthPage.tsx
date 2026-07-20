import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"student" | "host">("student");
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register({ ...form, role });
      navigate(role === "host" ? "/host" : "/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4">
      <div className="card w-full p-8">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
            <Building2 size={18} />
          </span>
          <h1 className="text-xl font-extrabold">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <>
              <input
                required
                placeholder="Full name"
                className="input"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
              <div className="flex gap-2">
                {(["student", "host"] as const).map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={`flex-1 rounded-xl border py-2 text-sm font-semibold capitalize ${
                      role === r ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </>
          )}
          <input
            required
            type="email"
            placeholder="Email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            required
            type="password"
            placeholder="Password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {error && <p className="text-sm text-accent-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          className="mt-3 w-full text-sm text-slate-500"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>

        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">
          Demo: student@uninest.app / host@uninest.app / admin@uninest.app · password123
        </p>
      </div>
    </div>
  );
}
