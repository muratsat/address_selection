import { useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Address, Location } from "@/types/location";
import { reverseGeocode } from "@/services/geocoding";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const BISHKEK_CENTER: Location = {
  lat: 42.8746,
  lng: 74.5698
};

const DEFAULT_ZOOM = 13;

interface MapControllerProps {
  center: Location;
  onMoveEnd: (location: Location) => void;
  onMoveStart: () => void;
}

function MapController({ onMoveEnd, onMoveStart }: MapControllerProps) {
  const map = useMap();

  useMapEvents({
    movestart: () => {
      onMoveStart();
    },
    moveend: () => {
      const center = map.getCenter();
      onMoveEnd({ lat: center.lat, lng: center.lng });
    }
  });

  return null;
}

export function AddressSelection() {
  const [center, setCenter] = useState<Location>(BISHKEK_CENTER);
  const [isPanning, setIsPanning] = useState(false);

  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<Address | null>(null);

  const mapRef = useRef<L.Map | null>(null);

  const handleMapMoveStart = () => {
    setIsPanning(true);
  };

  const handleMapMoveEnd = async (newLocation: Location) => {
    setCenter(newLocation);
    setIsPanning(false);
    setLoading(true);
    const newAddress = await reverseGeocode(center);
    setLoading(false);
    setAddress(newAddress);
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-gray-100">
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={DEFAULT_ZOOM}
          zoomControl={false}
          className="h-full w-full"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController
            center={center}
            onMoveStart={handleMapMoveStart}
            onMoveEnd={handleMapMoveEnd}
          />
        </MapContainer>
      </div>

      {/* Center Pin */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 pointer-events-none"
        style={{ zIndex: 1000 }}
      >
        {/* Pin */}
        <div
          className="transition-transform duration-200 ease-out"
          style={{ transform: `translateY(${isPanning ? -12 : 0}px)` }}
        >
          <svg
            width="40"
            height="50"
            viewBox="0 0 40 50"
            fill="none"
            style={{ transform: "translateY(-100%)" }}
          >
            <path
              d="M20 0C8.954 0 0 8.954 0 20c0 14 20 30 20 30s20-16 20-30C40 8.954 31.046 0 20 0z"
              fill="#E53935"
            />
            <circle cx="20" cy="18" r="7" fill="white" />
          </svg>
        </div>
        {/* Shadow */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 bg-black rounded-full transition-all duration-200 ease-out "
          style={{
            width: isPanning ? 12 : 8,
            height: isPanning ? 4 : 3,
            opacity: isPanning ? 0.25 : 0.4
          }}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {loading ? (
                <Skeleton className="h-5 w-48 bg-slate-200" />
              ) : (
                <p className="text-sm font-medium text-slate-900 truncate">
                  {address?.displayName ?? "Detecting location..."}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">Delivery address</p>
            </div>

            <Button disabled={loading || !address}>
              {loading ? "Loading..." : "Confirm"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
