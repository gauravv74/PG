import { Building2 } from "lucide-react";

const columns = [
  {
    title: "Explore",
    links: ["Trending cities", "Top universities", "Featured homes", "Special offers", "Blog"],
  },
  {
    title: "Company",
    links: ["About us", "Careers", "Press", "Partners", "Contact"],
  },
  {
    title: "Support",
    links: ["Help center", "Safety", "Cancellation options", "Report a listing", "FAQs"],
  },
  {
    title: "Hosting",
    links: ["List your property", "Host resources", "Community", "Responsible hosting"],
  },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-100 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-5">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
              <Building2 size={18} />
            </span>
            <span className="text-lg font-extrabold">UniNest</span>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Verified student homes worldwide. Book with confidence.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-bold text-slate-900">{col.title}</h4>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-slate-500 hover:text-brand-600">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 py-5 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} UniNest. All rights reserved. · Privacy · Terms · Sitemap
      </div>
    </footer>
  );
}
