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
  const orderingAvailable = location.ordering_available ?? null
  const availabilityStatus = location.availability_status ?? ''
  const availabilityMessage =
    location.availability_message
    ?? (orderingAvailable === false && availabilityStatus === 'coming_soon' ? 'Coming Soon!' : '')

  return {
    id: String(location.id ?? location.location_id ?? ''),
    name: location.name ?? location.store_name ?? '',
    storeName: location.store_name ?? location.name ?? '',
    displayName: location.display_name ?? '',
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
    orderingAvailable,
    availabilityStatus,
    availabilityMessage,
    wifi: location.wifi ?? null,
    driveThru: location.drive_thru ?? null,
    doorDash: location.door_dash ?? null,
    services: Array.isArray(location.services) ? location.services : [],
    holidayHours: Array.isArray(location.holiday_hours) ? location.holiday_hours : [],
    pickupSupported: location.pickup_supported ?? null,
    dineInSupported: location.dine_in_supported ?? null,
    nearBy: location.near_by ?? '',
    nearbyStoreIds: Array.isArray(location.nearby_store_ids) ? location.nearby_store_ids.map(String) : [],
    region: location.region ?? '',
    metroArea: location.metro_area ?? '',
    distanceMiles: location.distance_miles ?? null,
    raw: location,
  }
}

function normalizeLocationAvailability(payload) {
  const record = extractRecord(payload, ['availability', 'data']) ?? payload ?? {}

  return {
    locationId: String(record.location_id ?? record.id ?? ''),
    displayName: record.display_name ?? '',
    orderingAvailable: record.ordering_available ?? null,
    openNow: record.open_now ?? null,
    acceptingOrdersNow: record.accepting_orders_now ?? null,
    availabilityStatus: record.availability_status ?? '',
    availabilityMessage: record.availability_message ?? '',
    nextOpenAt: record.next_open_at ?? '',
    nextCloseAt: record.next_close_at ?? '',
    validPickupWindows: Array.isArray(record.valid_pickup_windows) ? record.valid_pickup_windows : [],
    raw: record,
  }
}

export function isStoreOrderable(store) {
  return store?.orderingAvailable === true
}

export function formatStoreOptionLabel(location, locations = []) {
  if (!location) {
    return 'Store unavailable'
  }

  if (location.displayName) {
    return location.displayName
  }

  const city = location.city || 'Store'
  const streetSource = location.address || location.fullAddress || location.mapAddress || ''
  const street = String(streetSource)
    .split(',')[0]
    .replace(/^\d+\s*/, '')
    .replace(/\s+(Suite|Ste|Unit)\b.*$/i, '')
    .trim()

  const baseLabel = street ? `${city} - ${street}` : `${city}${location.state ? `, ${location.state}` : ''}`
  const duplicates = locations.filter((entry) =>
    entry.id !== location.id
    && entry.city === location.city
    && (entry.address || '').replace(/^\d+\s*/, '').trim() === (location.address || '').replace(/^\d+\s*/, '').trim(),
  )

  return duplicates.length && location.state ? `${baseLabel}, ${location.state}` : baseLabel
}

function parseNearByKeywords(value) {
  return String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 2)
}

function distanceBetween(first, second) {
  if (
    !first
    || !second
    || first.latitude === null
    || first.latitude === undefined
    || first.longitude === null
    || first.longitude === undefined
    || second.latitude === null
    || second.latitude === undefined
    || second.longitude === null
    || second.longitude === undefined
  ) {
    return Number.POSITIVE_INFINITY
  }

  const toRadians = (value) => (value * Math.PI) / 180
  const earthRadiusMiles = 3958.8
  const deltaLat = toRadians(Number(second.latitude) - Number(first.latitude))
  const deltaLon = toRadians(Number(second.longitude) - Number(first.longitude))
  const startLat = toRadians(Number(first.latitude))
  const endLat = toRadians(Number(second.latitude))
  const a =
    Math.sin(deltaLat / 2) ** 2
    + Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLon / 2) ** 2

  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(a))
}

export function sortNearbyLocations(locations = [], selectedLocation = null, userCoordinates = null) {
  if (!selectedLocation) {
    return []
  }

  const nearbyStoreIds = new Set((selectedLocation.nearbyStoreIds || []).map(String))
  const selectedKeywords = new Set([
    ...parseNearByKeywords(selectedLocation.nearBy),
    ...parseNearByKeywords(selectedLocation.city),
    ...parseNearByKeywords(selectedLocation.state),
    ...parseNearByKeywords(selectedLocation.region),
    ...parseNearByKeywords(selectedLocation.metroArea),
  ])

  return [...locations]
    .filter((location) => location.id !== selectedLocation.id)
    .map((location) => {
      const locationKeywords = parseNearByKeywords(location.nearBy)
      const keywordScore = locationKeywords.reduce(
        (total, keyword) => total + (selectedKeywords.has(keyword) ? 1 : 0),
        0,
      )
      const linkedScore = nearbyStoreIds.has(location.id) ? 3 : 0

      const distanceFromSelected = distanceBetween(selectedLocation, location)
      const distanceFromUser = userCoordinates
        ? distanceBetween(
            {
              latitude: userCoordinates.latitude,
              longitude: userCoordinates.longitude,
            },
            location,
          )
        : Number.POSITIVE_INFINITY

      return {
        ...location,
        nearbyKeywordScore: keywordScore + linkedScore,
        nearbyDistance: Number.isFinite(distanceFromSelected) ? distanceFromSelected : distanceFromUser,
      }
    })
    .sort((left, right) => {
      if (left.nearbyKeywordScore !== right.nearbyKeywordScore) {
        return right.nearbyKeywordScore - left.nearbyKeywordScore
      }

      return left.nearbyDistance - right.nearbyDistance
    })
}

export function findClosestLocation(locations = [], userCoordinates = null) {
  if (!userCoordinates) {
    return null
  }

  const [closest] = [...locations]
    .filter((location) => location.latitude !== null && location.longitude !== null)
    .sort((left, right) =>
      distanceBetween(
        {
          latitude: userCoordinates.latitude,
          longitude: userCoordinates.longitude,
        },
        left,
      ) - distanceBetween(
        {
          latitude: userCoordinates.latitude,
          longitude: userCoordinates.longitude,
        },
        right,
      ),
    )

  return closest ?? null
}

export async function fetchLocations(options = {}) {
  try {
    const params = new URLSearchParams()

    if (options.orderableOnly) {
      params.set('orderable_only', 'true')
    }

    const path = params.toString() ? `/locations?${params.toString()}` : '/locations'
    const response = await apiFetch(path)
    return extractCollection(response, ['locations', 'data', 'stores']).map(normalizeLocation)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load locations right now.'))
  }
}

export async function fetchOrderableLocations() {
  const locations = await fetchLocations({ orderableOnly: true })
  return locations.filter((location) => location.openForBusiness === true)
}

export async function fetchNearbyLocations(latitude, longitude, options = {}) {
  try {
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      return []
    }

    const params = new URLSearchParams({
      lat: String(latitude),
      lng: String(longitude),
    })

    if (options.orderableOnly !== false) {
      params.set('orderable_only', 'true')
    }

    if (options.openForBusiness !== undefined) {
      params.set('open_for_business', String(options.openForBusiness))
    }

    if (options.limit) {
      params.set('limit', String(options.limit))
    }

    const response = await apiFetch(`/locations/nearby?${params.toString()}`)
    return extractCollection(response, ['locations', 'data', 'stores']).map(normalizeLocation)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load nearby locations right now.'))
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

export async function fetchLocationAvailability(locationId) {
  try {
    const response = await apiFetch(`/locations/${encodeURIComponent(locationId)}/availability`)
    return normalizeLocationAvailability(response)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load pickup availability for this store right now.'))
  }
}
