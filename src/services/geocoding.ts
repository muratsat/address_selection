import type { Address, Location, NominatimResponse, SearchResult } from '@/types/location'

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'

// Nominatim requires a User-Agent header
const headers = {
  'User-Agent': 'AddressSelectionApp/1.0',
}

function parseAddress(nominatimData: NominatimResponse): Address {
  const { display_name, address } = nominatimData

  return {
    displayName: display_name,
    street: address?.road,
    city: address?.city || address?.suburb,
    district: address?.suburb,
    country: address?.country,
    postalCode: address?.postcode,
  }
}

export async function reverseGeocode(location: Location): Promise<Address> {
  const params = new URLSearchParams({
    lat: location.lat.toString(),
    lon: location.lng.toString(),
    format: 'json',
    addressdetails: '1',
    zoom: '18',
    // Limit results to Bishkek, Kyrgyzstan
    countrycodes: 'kg',
  })

  try {
    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
      headers,
    })

    if (!response.ok) {
      throw new Error('Failed to reverse geocode location')
    }

    const data: NominatimResponse = await response.json()
    return parseAddress(data)
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    throw error
  }
}

export async function searchLocation(query: string): Promise<SearchResult[]> {
  if (!query.trim()) {
    return []
  }

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '5',
    // Bias results toward Bishkek
    viewbox: '74.4616,42.8195,74.7068,42.9347', // Bishkek bounding box
    bounded: '0',
    countrycodes: 'kg',
  })

  try {
    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
      headers,
    })

    if (!response.ok) {
      throw new Error('Failed to search location')
    }

    const data: NominatimResponse[] = await response.json()

    return data.map((item) => ({
      id: item.place_id.toString(),
      displayName: item.display_name,
      location: {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      },
    }))
  } catch (error) {
    console.error('Location search error:', error)
    throw error
  }
}
