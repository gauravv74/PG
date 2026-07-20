import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function Carousel({ title, subtitle, action, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {action}
          <div className="hidden gap-1 sm:flex">
            <button onClick={() => scroll(-1)} className="btn-outline h-9 w-9 !px-0">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => scroll(1)} className="btn-outline h-9 w-9 !px-0">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
      <div
        ref={ref}
        className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4"
      >
        {children}
      </div>
    </section>
  );
}
