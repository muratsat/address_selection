export interface Location {
  lat: number
  lng: number
}

export interface Address {
  displayName: string
  street?: string
  city?: string
  district?: string
  country?: string
  postalCode?: string
}

export interface SearchResult {
  id: string
  displayName: string
  location: Location
}

export interface NominatimResponse {
  place_id: number
  lat: string
  lon: string
  display_name: string
  address?: {
    road?: string
    suburb?: string
    city?: string
    state?: string
    country?: string
    postcode?: string
  }
}
