import { apiClient, extractRecord, getErrorMessage } from './api'

const STORAGE_KEY = 'uncle-joes-member-session'

export function normalizeMember(payload) {
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
    tier: record.rewards_tier ?? record.tier ?? record.membership_tier ?? '',
    pointsToNextReward: record.points_to_next_reward ?? null,
    preferredStoreId: record.preferred_store_id ?? record.home_store ?? '',
    preferredStore: record.preferred_store ?? null,
    joinDate: record.join_date ?? '',
    birthdayMonthDay: record.birthday_month_day ?? '',
    marketingOptIn: record.marketing_opt_in ?? null,
    profilePhotoUrl: record.profile_photo_url ?? '',
    raw: record,
  }
}

function persistSession(member) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(member))
}

export async function fetchAuthenticatedMember() {
  const sessionResponse = await apiClient.get('/api/member/session')

  if (!sessionResponse.data?.authenticated) {
    return null
  }

  if (sessionResponse.data?.member) {
    return normalizeMember(sessionResponse.data.member)
  }

  const profileResponse = await apiClient.get('/api/member/profile')
  return normalizeMember(profileResponse.data)
}

export async function loginMember(credentials) {
  try {
    const response = await apiClient.post('/api/member/login', credentials)
    const member =
      response.data?.member ? normalizeMember(response.data.member) : await fetchAuthenticatedMember()

    if (!member) {
      throw new Error('Login succeeded but no member profile was returned.')
    }

    persistSession(member)
    return member
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not sign you in. Please check your credentials.'))
  }
}

export async function restoreSession() {
  try {
    const member = await fetchAuthenticatedMember()

    if (member) {
      persistSession(member)
      return member
    }

    localStorage.removeItem(STORAGE_KEY)
    return null
  } catch {
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
}

export async function logoutMember() {
  try {
    await apiClient.post('/api/member/logout')
  } catch {
    // Clear local state even if the remote session is already gone.
  } finally {
    localStorage.removeItem(STORAGE_KEY)
  }
}
