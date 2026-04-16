export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  'https://uncle-joes-api-129124698283.us-central1.run.app'

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function apiFetch(path, options = {}) {
  const {
    method = 'GET',
    data,
    headers = {},
    credentials,
    auth = false,
    ...rest
  } = options

  const requestHeaders = new Headers(headers)
  const requestOptions = {
    method,
    headers: requestHeaders,
    credentials: credentials ?? (auth ? 'include' : 'same-origin'),
    ...rest,
  }

  if (data !== undefined) {
    if (!requestHeaders.has('Content-Type')) {
      requestHeaders.set('Content-Type', 'application/json')
    }

    requestOptions.body =
      requestHeaders.get('Content-Type') === 'application/json' && typeof data !== 'string'
        ? JSON.stringify(data)
        : data
  }

  const url = new URL(path, API_BASE).toString()
  let response

  try {
    response = await fetch(url, requestOptions)
  } catch (error) {
    console.error('[apiFetch] Fetch failed', {
      url,
      method,
      error,
    })
    throw error
  }

  const contentType = response.headers.get('content-type') || ''
  const rawText = await response.text()
  let payload = null

  if (contentType.includes('application/json') && rawText) {
    try {
      payload = JSON.parse(rawText)
    } catch {
      payload = rawText
    }
  } else {
    payload = rawText || null
  }

  if (!response.ok) {
    const detail =
      payload?.detail ||
      payload?.message ||
      payload?.error ||
      (typeof payload === 'string' ? payload : '')
    const message = detail
      ? `${response.status} ${response.statusText}: ${detail}`
      : `${response.status} ${response.statusText}`

    console.error('[apiFetch] Request failed', {
      url,
      method,
      status: response.status,
      statusText: response.statusText,
      responseText: rawText,
      payload,
    })

    throw new ApiError(message, response.status, payload)
  }

  return payload
}

export function extractCollection(payload, fallbacks = []) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (!payload || typeof payload !== 'object') {
    return []
  }

  for (const key of fallbacks) {
    if (Array.isArray(payload[key])) {
      return payload[key]
    }
  }

  return []
}

export function extractRecord(payload, fallbacks = []) {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  for (const key of fallbacks) {
    if (payload[key] && typeof payload[key] === 'object') {
      return payload[key]
    }
  }

  return payload
}

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.data?.detail) {
    return `${error.status ? `${error.status}: ` : ''}${error.data.detail}`
  }

  if (error?.data?.message) {
    return `${error.status ? `${error.status}: ` : ''}${error.data.message}`
  }

  if (error?.message) {
    return error.message
  }

  return fallback
}
