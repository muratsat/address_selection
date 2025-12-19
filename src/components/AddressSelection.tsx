import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Address, Location, SearchResult } from "@/types/location";
import { reverseGeocode, searchLocation } from "@/services/geocoding";
import { useDebounce } from "@/hooks/useDebounce";
import { useGeolocation } from "@/hooks/useGeolocation";
import { SearchBar } from "./ui/SearchBar";
import { LocationButton } from "./ui/LocationButton";
import { ZoomControls } from "./ui/ZoomControls";
import { BottomSheet, type DrawerState } from "./ui/BottomSheet";
import { Button } from "./ui/button";
import { MapPin } from "lucide-react";

// Bishkek center coordinates
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

function MapController({ center, onMoveEnd, onMoveStart }: MapControllerProps) {
  const map = useMap();

  // Handle programmatic center changes
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center, map]);

  // Handle map move events
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
  const [confirmedCenter, setConfirmedCenter] =
    useState<Location>(BISHKEK_CENTER);
  const [confirmedAddress, setConfirmedAddress] = useState<Address | null>(
    null
  );
  const [previewAddress, setPreviewAddress] = useState<Address | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSelectButton, setShowSelectButton] = useState(false);
  const [drawerState, setDrawerState] = useState<DrawerState>("preview");
  const [isPanning, setIsPanning] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const debouncedCenter = useDebounce(center, 500);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const {
    location: gpsLocation,
    loading: gpsLoading,
    getCurrentLocation
  } = useGeolocation();

  // Load initial address on mount
  useEffect(() => {
    const loadInitialAddress = async () => {
      setLoadingAddress(true);
      try {
        const initialAddress = await reverseGeocode(BISHKEK_CENTER);
        setConfirmedAddress(initialAddress);
        setPreviewAddress(initialAddress);
      } catch (error) {
        console.error("Failed to load initial address:", error);
      } finally {
        setLoadingAddress(false);
      }
    };

    loadInitialAddress();
  }, []);

  // Update preview address when center changes (debounced)
  useEffect(() => {
    const updateAddress = async () => {
      setLoadingAddress(true);
      try {
        const newAddress = await reverseGeocode(debouncedCenter);
        setPreviewAddress(newAddress);
      } catch (error) {
        console.error("Failed to reverse geocode:", error);
        setPreviewAddress(null);
      } finally {
        setLoadingAddress(false);
      }
    };

    updateAddress();
  }, [debouncedCenter]);

  // Search locations (debounced)
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const search = async () => {
      setIsSearching(true);
      try {
        const results = await searchLocation(debouncedSearchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    search();
  }, [debouncedSearchQuery]);

  // Handle GPS location
  useEffect(() => {
    if (gpsLocation) {
      setCenter(gpsLocation);
    }
  }, [gpsLocation]);

  // Check if location has changed from confirmed location
  useEffect(() => {
    const hasChanged =
      Math.abs(center.lat - confirmedCenter.lat) > 0.0001 ||
      Math.abs(center.lng - confirmedCenter.lng) > 0.0001;
    setShowSelectButton(hasChanged);
  }, [center, confirmedCenter]);

  const handleMapMoveStart = () => {
    // User is panning the map
    setIsPanning(true);
    if (drawerState !== "search") {
      setDrawerState("panning");
    }
  };

  const handleMapMoveEnd = (newLocation: Location) => {
    setCenter(newLocation);
    // User stopped panning
    setIsPanning(false);
    if (drawerState === "panning") {
      setDrawerState("preview");
    }
  };

  const handleConfirm = () => {
    setConfirmedCenter(center);
    setConfirmedAddress(previewAddress);
    console.log("Selected location:", {
      center,
      address: previewAddress
    });
    alert(`Location confirmed: ${previewAddress?.displayName || "Unknown"}`);
  };

  const handleSearchOpen = () => {
    setDrawerState("search");
  };

  const handleSearchClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setDrawerState("preview");
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearchResultClick = (result: SearchResult) => {
    setCenter(result.location);
    setSearchQuery("");
    setSearchResults([]);
    setDrawerState("preview");
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-gray-100">
      {/* Map */}
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

      {/* Center Pin Marker */}
      <div className="absolute left-1/2 top-1/2 z-10 pointer-events-none">
        <div className="relative -translate-x-1/2 -translate-y-full">
          {/* Pin Icon */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              fill="#FCD535"
              stroke="#000"
              strokeWidth="1"
            />
            <circle cx="12" cy="9" r="2.5" fill="#000" />
          </svg>
          {/* Pin shadow */}
          <div className="absolute left-1/2 top-full -translate-x-1/2 w-6 h-2 bg-black/20 rounded-full blur-sm" />
        </div>
      </div>

      {/* selected address at the top */}
      {/* <div className="absolute top-0 left-0 right-0 h-dvh-sm bg-white">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">
              {confirmedAddress?.displayName || "Unknown"}
            </span>
          </div>
          <Button
            variant="secondary"
            className="h-dvh-sm"
            onClick={handleConfirm}
          >
            Confirm
          </Button>
        </div>
      </div> */}

      {/* Bottom sheet */}
      <BottomSheet
        state={drawerState}
        address={drawerState === "panning" ? confirmedAddress : previewAddress}
        loading={loadingAddress}
        searchQuery={searchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        onConfirm={handleConfirm}
        onSearchChange={handleSearchChange}
        onSearchResultClick={handleSearchResultClick}
        onSearchOpen={handleSearchOpen}
        onSearchClose={handleSearchClose}
      />
    </div>
  );
}
