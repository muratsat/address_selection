import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Location } from "@/types/location";
import { BottomSheet, type DrawerState } from "./ui/BottomSheet";

const BISHKEK_CENTER: Location = {
  lat: 42.8746,
  lng: 74.5698
};

const PIN_OFFSET_PX = 150;

const DEFAULT_ZOOM = 13;

interface MapControllerProps {
  center: Location;
  onMoveEnd: (location: Location) => void;
  onMoveStart: () => void;
}

function MapController({ center, onMoveEnd, onMoveStart }: MapControllerProps) {
  const map = useMap();
  const isProgrammaticMove = useRef(false);
  const pendingCenter = useRef<Location | null>(null);

  useEffect(() => {
    // Skip if this center came from user panning
    if (
      pendingCenter.current &&
      pendingCenter.current.lat === center.lat &&
      pendingCenter.current.lng === center.lng
    ) {
      pendingCenter.current = null;
      return;
    }

    isProgrammaticMove.current = true;
    const targetPoint = map.latLngToContainerPoint([center.lat, center.lng]);
    const offsetPoint = L.point(targetPoint.x, targetPoint.y - PIN_OFFSET_PX);
    const offsetLatLng = map.containerPointToLatLng(offsetPoint);
    map.setView(offsetLatLng, map.getZoom());
  }, [center, map]);

  useMapEvents({
    movestart: () => {
      if (!isProgrammaticMove.current) {
        onMoveStart();
      }
    },
    moveend: () => {
      if (isProgrammaticMove.current) {
        isProgrammaticMove.current = false;
        return;
      }
      const mapCenter = map.getCenter();
      const centerPoint = map.latLngToContainerPoint(mapCenter);
      const offsetPoint = L.point(centerPoint.x, centerPoint.y + PIN_OFFSET_PX);
      const offsetLatLng = map.containerPointToLatLng(offsetPoint);

      // Track what we're about to set so useEffect knows to skip it
      pendingCenter.current = { lat: offsetLatLng.lat, lng: offsetLatLng.lng };
      onMoveEnd(pendingCenter.current);
    }
  });

  return null;
}

export function AddressSelection() {
  const [center, setCenter] = useState<Location>(BISHKEK_CENTER);
  const [drawerState, setDrawerState] = useState<DrawerState>("preview");
  const mapRef = useRef<L.Map | null>(null);

  const handleMapMoveStart = () => {
    if (drawerState !== "search") {
      setDrawerState("panning");
    }
  };

  const handleMapMoveEnd = (newLocation: Location) => {
    setCenter(newLocation);
    if (drawerState === "panning") {
      setDrawerState("preview");
    }
  };

  const isPanning = drawerState === "panning";

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
        className="absolute left-1/2 top-1/2 -translate-x-1/2 pointer-events-none z-50"
        style={{ marginTop: -PIN_OFFSET_PX }}
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
          className="absolute left-1/2 -translate-x-1/2 top-0 bg-black rounded-full transition-all duration-200 ease-out"
          style={{
            width: isPanning ? 12 : 8,
            height: isPanning ? 4 : 3,
            opacity: isPanning ? 0.25 : 0.4
          }}
        />
      </div>

      {/* Bottom sheet */}
      <BottomSheet state={drawerState} pinLocation={center} />
    </div>
  );
}
