import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://uncle-joes-api-129124698283.us-central1.run.app'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

export const authenticatedApiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

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
  if (error?.response?.data?.detail) {
    return error.response.data.detail
  }

  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  if (error?.message) {
    return error.message
  }

  return fallback
}
