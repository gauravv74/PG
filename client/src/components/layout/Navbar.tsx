import { Link, useNavigate } from "react-router-dom";
import { Building2, Heart, Menu, Search, User2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <Building2 size={18} />
          </span>
          <span className="text-lg font-extrabold tracking-tight">UniNest</span>
        </Link>

        <button
          onClick={() => navigate("/search")}
          className="hidden items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-500 shadow-soft hover:shadow-card md:flex"
        >
          <Search size={16} /> Search cities, universities, homes…
        </button>

        <nav className="flex items-center gap-1">
          <Link to="/search" className="btn-ghost hidden sm:inline-flex">
            Explore
          </Link>
          <Link to="/host" className="btn-ghost hidden sm:inline-flex">
            Become a Host
          </Link>
          <Link to="/dashboard" className="btn-ghost hidden sm:inline-flex" aria-label="Wishlist">
            <Heart size={18} />
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link to={user.role === "host" ? "/host" : user.role === "admin" ? "/admin" : "/dashboard"} className="btn-outline">
                <User2 size={16} /> {user.full_name.split(" ")[0]}
              </Link>
              <button onClick={logout} className="btn-ghost">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn-primary">
              Sign in
            </Link>
          )}
          <button onClick={() => setOpen(!open)} className="btn-ghost sm:hidden">
            <Menu size={18} />
          </button>
        </nav>
      </div>
    </header>
  );
}
