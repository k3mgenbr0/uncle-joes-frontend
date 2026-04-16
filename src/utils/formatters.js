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
