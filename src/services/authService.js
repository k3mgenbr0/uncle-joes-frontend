import { apiFetch, extractRecord, getErrorMessage } from './api'

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
  const sessionResponse = await apiFetch('/api/member/session', { auth: true })

  if (!sessionResponse?.authenticated) {
    return null
  }

  const sessionMember = sessionResponse?.member ?? null

  try {
    const profileResponse = await apiFetch('/api/member/profile', { auth: true })
    const mergedRecord =
      sessionMember && profileResponse && typeof profileResponse === 'object'
        ? {
            ...(typeof sessionMember === 'object' ? sessionMember : {}),
            ...(typeof profileResponse === 'object' ? profileResponse : {}),
          }
        : profileResponse ?? sessionMember

    return normalizeMember(mergedRecord)
  } catch (error) {
    if (sessionMember) {
      return normalizeMember(sessionMember)
    }

    throw error
  }
}

export async function loginMember(credentials) {
  try {
    await apiFetch('/api/member/login', {
      method: 'POST',
      data: credentials,
      auth: true,
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const member = await fetchAuthenticatedMember()

    if (!member) {
      throw new Error('Sign-in succeeded, but the Coffee Club session was not established.')
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
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export async function logoutMember() {
  try {
    await apiFetch('/api/member/logout', {
      method: 'POST',
      auth: true,
    })
  } catch {
    // Clear local state even if the remote session is already gone.
  } finally {
    localStorage.removeItem(STORAGE_KEY)
  }
}
