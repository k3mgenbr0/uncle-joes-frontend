import { apiFetch, extractCollection, extractRecord, getErrorMessage } from './api'
import { formatHoursRange } from '../utils/formatters'

function formatHoursDay(day) {
  if (!day?.open || !day?.close) {
    return 'Closed'
  }

  return formatHoursRange(day.open, day.close)
}

function formatHours(hours) {
  if (!hours || typeof hours !== 'object') {
    return ''
  }

  const entries = Object.entries(hours)
    .filter(([, value]) => value && typeof value === 'object')
    .map(([day, value]) => `${day.slice(0, 3)}: ${formatHoursDay(value)}`)

  return entries.join(' • ')
}

function normalizeLocation(location) {
  const hours = location.hours ?? location.open_hours ?? location.business_hours ?? null
  const hoursToday = location.hours_today ?? null
  const addressOne = location.address ?? location.address_one ?? location.street_address ?? ''
  const addressTwo = location.address_two ?? ''

  return {
    id: String(location.id ?? location.location_id ?? ''),
    name: location.name ?? location.store_name ?? '',
    storeName: location.store_name ?? location.name ?? '',
    city: location.city ?? '',
    state: location.state ?? '',
    address: addressOne,
    addressLineTwo: addressTwo,
    fullAddress: location.full_address ?? '',
    mapAddress: location.map_address ?? '',
    postalCode: location.postal_code ?? '',
    hours,
    hoursLabel: typeof hours === 'string' ? hours : formatHours(hours),
    hoursToday,
    hoursTodayLabel: formatHoursDay(hoursToday),
    phone: location.phone ?? location.phone_number ?? '',
    email: location.email ?? '',
    latitude: location.latitude ?? null,
    longitude: location.longitude ?? null,
    openNow: location.open_now ?? null,
    openForBusiness: location.open_for_business ?? null,
    wifi: location.wifi ?? null,
    driveThru: location.drive_thru ?? null,
    doorDash: location.door_dash ?? null,
    services: Array.isArray(location.services) ? location.services : [],
    holidayHours: Array.isArray(location.holiday_hours) ? location.holiday_hours : [],
    pickupSupported: location.pickup_supported ?? null,
    dineInSupported: location.dine_in_supported ?? null,
    nearBy: location.near_by ?? '',
    raw: location,
  }
}

export async function fetchLocations() {
  try {
    const response = await apiFetch('/locations')
    return extractCollection(response, ['locations', 'data', 'stores']).map(normalizeLocation)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load locations right now.'))
  }
}

export async function fetchLocation(locationId) {
  try {
    const response = await apiFetch(`/locations/${locationId}`)
    return normalizeLocation(extractRecord(response, ['location', 'data', 'store']) ?? {})
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load that location.'))
  }
}
