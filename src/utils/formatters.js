export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value || 0))
}

export function formatDate(value, options = {}) {
  if (!value) {
    return 'Unavailable'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(parsed)
}

export function formatDateTime(value) {
  if (!value) {
    return 'Unavailable'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed)
}

export function formatTime(value) {
  if (!value) {
    return ''
  }

  const normalized = String(value).trim()
  const compactMatch = normalized.match(/^(\d{3,4})$/)

  if (compactMatch) {
    const digits = compactMatch[1].padStart(4, '0')
    const hours = Number(digits.slice(0, 2))
    const minutes = Number(digits.slice(2, 4))

    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      const date = new Date()
      date.setHours(hours, minutes, 0, 0)

      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(date)
    }
  }

  const match = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)

  if (!match) {
    return normalized
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return normalized
  }

  const date = new Date()
  date.setHours(hours, minutes, 0, 0)

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function formatHoursRange(open, close) {
  if (!open || !close) {
    return 'Closed'
  }

  return `${formatTime(open)} - ${formatTime(close)}`
}

export function formatMonthDay(value) {
  if (!value) {
    return 'Unavailable'
  }

  const parts = String(value).split('-')

  if (parts.length !== 2) {
    return value
  }

  const year = new Date().getFullYear()
  const parsed = new Date(`${year}-${parts[0]}-${parts[1]}T12:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
  }).format(parsed)
}

export function formatPhone(value) {
  if (!value) {
    return 'Unavailable'
  }

  const digits = String(value).replace(/\D/g, '')

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }

  return value
}

export function formatStoreLabel(locationName, city, state) {
  return locationName || [city, state].filter(Boolean).join(', ') || 'Location unavailable'
}

export function formatTitleCase(value) {
  if (!value) {
    return ''
  }

  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function formatCityStatePostal(city, state, postalCode) {
  const place = [city, state].filter(Boolean).join(', ')

  if (place && postalCode) {
    return `${place} ${postalCode}`
  }

  return place || postalCode || ''
}

export function formatServiceLabel(value) {
  if (!value) {
    return ''
  }

  const normalized = String(value)
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()

  const specialCases = {
    wifi: 'Wi-Fi',
    'wi fi': 'Wi-Fi',
    doordash: 'DoorDash',
    'door dash': 'DoorDash',
    'drive thru': 'Drive-Thru',
    drivethru: 'Drive-Thru',
    pickup: 'Pickup',
    'pick up': 'Pickup',
    'dine in': 'Dine-In',
    dinein: 'Dine-In',
    'in store': 'In Store',
    instore: 'In Store',
  }

  if (specialCases[normalized]) {
    return specialCases[normalized]
  }

  return normalized.replace(/\b\w/g, (character) => character.toUpperCase())
}

export function dedupeLabels(values = [], formatter = (value) => value) {
  const seen = new Set()

  return values.reduce((result, value) => {
    const formatted = formatter(value)

    if (!formatted) {
      return result
    }

    const key = formatted.toLowerCase()

    if (seen.has(key)) {
      return result
    }

    seen.add(key)
    result.push(formatted)
    return result
  }, [])
}

export function isAuthErrorMessage(message) {
  if (!message) {
    return false
  }

  const normalized = String(message).toLowerCase()
  return normalized.includes('401') || normalized.includes('authentication required') || normalized.includes('unauthorized')
}

export function formatFeatureError(message, fallbackTitle) {
  if (isAuthErrorMessage(message)) {
    return `${fallbackTitle} require an active Coffee Club sign-in. Please log in again.`
  }

  return message
}
