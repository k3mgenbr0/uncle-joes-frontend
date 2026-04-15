import { apiClient, extractCollection, extractRecord, getErrorMessage } from './api'

function normalizeLocation(location) {
  return {
    id: String(location.id ?? location.location_id ?? ''),
    name: location.name ?? location.store_name ?? '',
    city: location.city ?? '',
    state: location.state ?? '',
    address: location.address ?? location.street_address ?? '',
    hours: location.hours ?? location.open_hours ?? location.business_hours ?? '',
    phone: location.phone ?? location.phone_number ?? '',
    raw: location,
  }
}

export async function fetchLocations() {
  try {
    const response = await apiClient.get('/locations')
    return extractCollection(response.data, ['locations', 'data', 'stores']).map(normalizeLocation)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load locations right now.'))
  }
}

export async function fetchLocation(locationId) {
  try {
    const response = await apiClient.get(`/locations/${locationId}`)
    return normalizeLocation(extractRecord(response.data, ['location', 'data', 'store']) ?? {})
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load that location.'))
  }
}
