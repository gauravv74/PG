import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { cx } from "@/lib/format";

interface Props {
  lat: number;
  lng: number;
  count: number;
  /** total points across the whole cluster tree (for sizing) */
  onClick: () => void;
}

/** A clustered marker bubble. Size scales gently with the point count. */
export default function ClusterMarker({ lat, lng, count, onClick }: Props) {
  const size = count < 10 ? 40 : count < 50 ? 48 : count < 100 ? 56 : 64;
  const label = count >= 1000 ? `${(count / 1000).toFixed(1)}k+` : `${count}`;

  return (
    <AdvancedMarker position={{ lat, lng }} onClick={onClick} zIndex={500} className="animate-marker-pop">
      <div
        style={{ width: size, height: size }}
        className={cx(
          "grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-sm font-bold text-white",
          "animate-cluster-pulse cursor-pointer bg-brand-600/90 ring-4 ring-white transition-transform hover:scale-110"
        )}
      >
        {label}
      </div>
    </AdvancedMarker>
  );
}
