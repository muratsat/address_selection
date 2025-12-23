import { useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Address, Location, SearchResult } from "@/types/location";
import { reverseGeocode, searchLocation } from "@/services/geocoding";
import { MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const BISHKEK_CENTER: Location = {
  lat: 42.8746,
  lng: 74.5698
};

const DEFAULT_ZOOM = 13;
const SEARCH_ZOOM = 16;

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

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const mapRef = useRef<L.Map | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMapMoveStart = () => {
    setIsPanning(true);
  };

  const handleMapMoveEnd = async (newLocation: Location) => {
    setCenter(newLocation);
    setIsPanning(false);
    setLoading(true);
    const newAddress = await reverseGeocode(newLocation);
    setLoading(false);
    setAddress(newAddress);
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocation(searchQuery);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearchResultSelect = async (result: SearchResult) => {
    // Close search results
    setShowResults(false);
    setSearchQuery("");
    setSearchResults([]);

    // Smoothly fly to the selected location
    if (mapRef.current) {
      const map = mapRef.current;

      // Use flyTo for smooth animation with zoom
      map.flyTo([result.location.lat, result.location.lng], SEARCH_ZOOM, {
        duration: 1.5, // 1.5 seconds animation
        easeLinearity: 0.25
      });

      // Set loading state and fetch address after animation
      setLoading(true);

      // Wait for animation to complete, then reverse geocode
      setTimeout(async () => {
        setCenter(result.location);
        const newAddress = await reverseGeocode(result.location);
        setAddress(newAddress);
        setLoading(false);
      }, 1500); // Match the flyTo duration
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-gray-100">
      {/* Search Bar */}
      <div className="absolute top-0 left-0 right-0 p-4" style={{ zIndex: 1001 }}>
        <div className="max-w-2xl mx-auto relative">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search for an address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl max-h-80 overflow-y-auto w-full">
              {isSearching ? (
                <div className="p-4 text-sm text-slate-500 text-center">
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSearchResultSelect(result)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {result.displayName}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-sm text-slate-500 text-center">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
