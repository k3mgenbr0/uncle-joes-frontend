import { apiClient, extractRecord, getErrorMessage } from './api'

const STORAGE_KEY = 'uncle-joes-member-session'

function normalizeMember(payload) {
  const record = extractRecord(payload, ['member', 'user', 'data', 'result'])

  if (!record) {
    throw new Error('Login response did not include member data.')
  }

  const id =
    record.id ??
    record.member_id ??
    record.memberId ??
    record.user_id ??
    record.userId

  if (!id) {
    throw new Error('Login succeeded but no member identifier was returned.')
  }

  return {
    id: String(id),
    email: record.email ?? record.member_email ?? '',
    firstName: record.first_name ?? record.firstName ?? '',
    lastName: record.last_name ?? record.lastName ?? '',
    name: record.name ?? record.full_name ?? record.fullName ?? '',
    tier: record.tier ?? record.membership_tier ?? '',
    raw: record,
  }
}

export async function loginMember(credentials) {
  try {
    const response = await apiClient.post('/login', credentials)
    const member = normalizeMember(response.data)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(member))
    return member
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not sign you in. Please check your credentials.'))
  }
}

export function restoreSession() {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function logoutMember() {
  localStorage.removeItem(STORAGE_KEY)
}
