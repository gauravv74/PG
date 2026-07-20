import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-2 text-xl font-bold">Page not found</h1>
        <p className="mt-1 text-slate-500">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary mt-6">
          Back to home
        </Link>
      </div>
    </div>
  );
}
