import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Address, Location, SearchResult } from '@/types/location'
import { reverseGeocode, searchLocation } from '@/services/geocoding'
import { useDebounce } from '@/hooks/useDebounce'
import { useGeolocation } from '@/hooks/useGeolocation'
import { SearchBar } from './ui/SearchBar'
import { LocationButton } from './ui/LocationButton'
import { ZoomControls } from './ui/ZoomControls'
import { BottomSheet } from './ui/BottomSheet'
import { Button } from './ui/button'
import { MapPin } from 'lucide-react'

// Bishkek center coordinates
const BISHKEK_CENTER: Location = {
  lat: 42.8746,
  lng: 74.5698,
}

const DEFAULT_ZOOM = 13

interface MapControllerProps {
  center: Location
  onMoveEnd: (location: Location) => void
}

function MapController({ center, onMoveEnd }: MapControllerProps) {
  const map = useMap()

  // Handle programmatic center changes
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom())
  }, [center, map])

  // Handle map move events
  useMapEvents({
    moveend: () => {
      const center = map.getCenter()
      onMoveEnd({ lat: center.lat, lng: center.lng })
    },
  })

  return null
}

interface MapZoomControllerProps {
  onZoomIn: () => void
  onZoomOut: () => void
}

function MapZoomController({ onZoomIn, onZoomOut }: MapZoomControllerProps) {
  const map = useMap()

  useEffect(() => {
    const handleZoomIn = () => map.zoomIn()
    const handleZoomOut = () => map.zoomOut()

    onZoomIn = handleZoomIn
    onZoomOut = handleZoomOut
  }, [map])

  return null
}

export function AddressSelection() {
  const [center, setCenter] = useState<Location>(BISHKEK_CENTER)
  const [confirmedCenter, setConfirmedCenter] = useState<Location>(BISHKEK_CENTER)
  const [confirmedAddress, setConfirmedAddress] = useState<Address | null>(null)
  const [previewAddress, setPreviewAddress] = useState<Address | null>(null)
  const [loadingAddress, setLoadingAddress] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSelectButton, setShowSelectButton] = useState(false)
  const mapRef = useRef<L.Map | null>(null)

  const debouncedCenter = useDebounce(center, 500)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const { location: gpsLocation, loading: gpsLoading, getCurrentLocation } = useGeolocation()

  // Load initial address on mount
  useEffect(() => {
    const loadInitialAddress = async () => {
      setLoadingAddress(true)
      try {
        const initialAddress = await reverseGeocode(BISHKEK_CENTER)
        setConfirmedAddress(initialAddress)
        setPreviewAddress(initialAddress)
      } catch (error) {
        console.error('Failed to load initial address:', error)
      } finally {
        setLoadingAddress(false)
      }
    }

    loadInitialAddress()
  }, [])

  // Update preview address when center changes (debounced)
  useEffect(() => {
    const updateAddress = async () => {
      setLoadingAddress(true)
      try {
        const newAddress = await reverseGeocode(debouncedCenter)
        setPreviewAddress(newAddress)
      } catch (error) {
        console.error('Failed to reverse geocode:', error)
        setPreviewAddress(null)
      } finally {
        setLoadingAddress(false)
      }
    }

    updateAddress()
  }, [debouncedCenter])

  // Search locations (debounced)
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResults([])
      return
    }

    const search = async () => {
      setIsSearching(true)
      try {
        const results = await searchLocation(debouncedSearchQuery)
        setSearchResults(results)
      } catch (error) {
        console.error('Search failed:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    search()
  }, [debouncedSearchQuery])

  // Handle GPS location
  useEffect(() => {
    if (gpsLocation) {
      setCenter(gpsLocation)
    }
  }, [gpsLocation])

  // Check if location has changed from confirmed location
  useEffect(() => {
    const hasChanged =
      Math.abs(center.lat - confirmedCenter.lat) > 0.0001 ||
      Math.abs(center.lng - confirmedCenter.lng) > 0.0001
    setShowSelectButton(hasChanged)
  }, [center, confirmedCenter])

  const handleMapMoveEnd = (newLocation: Location) => {
    setCenter(newLocation)
  }

  const handleSelectSearchResult = (result: SearchResult) => {
    setCenter(result.location)
  }

  const handleSelectLocation = () => {
    setConfirmedCenter(center)
    setConfirmedAddress(previewAddress)
    setShowSelectButton(false)
  }

  const handleZoomIn = () => {
    mapRef.current?.zoomIn()
  }

  const handleZoomOut = () => {
    mapRef.current?.zoomOut()
  }

  const handleConfirm = () => {
    console.log('Selected location:', { center: confirmedCenter, address: confirmedAddress })
    alert(`Location confirmed: ${confirmedAddress?.displayName || 'Unknown'}`)
  }

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
          <MapController center={center} onMoveEnd={handleMapMoveEnd} />
        </MapContainer>
      </div>

      {/* Center pin marker */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full" style={{ zIndex: 500 }}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
            fill="#EF4444"
          />
        </svg>
      </div>

      {/* Search bar */}
      <div className="absolute left-4 right-4 top-4" style={{ zIndex: 500 }}>
        <SearchBar
          onSelectLocation={handleSelectSearchResult}
          onSearch={setSearchQuery}
          results={searchResults}
          isSearching={isSearching}
        />
      </div>

      {/* Select location button - shows when pin moves */}
      {showSelectButton && (
        <div className="absolute left-1/2 top-1/2 mt-16 -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-300" style={{ zIndex: 500 }}>
          <Button
            onClick={handleSelectLocation}
            className="h-12 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            <MapPin className="mr-2 h-5 w-5" />
            Select this location
          </Button>
        </div>
      )}

      {/* Location and zoom controls */}
      <div className="absolute bottom-55 right-4 flex flex-col gap-3" style={{ zIndex: 500 }}>
        <LocationButton
          onClick={getCurrentLocation}
          loading={gpsLoading}
        />
        <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
      </div>

      {/* Bottom sheet */}
      <BottomSheet
        address={confirmedAddress}
        loading={loadingAddress && !confirmedAddress}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
