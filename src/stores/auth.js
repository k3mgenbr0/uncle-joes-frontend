import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { loginMember, logoutMember, restoreSession as restoreStoredSession } from '../services/authService'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref(null)
  const hasRestoredSession = ref(false)
  const isRestoringSession = ref(false)

  const isAuthenticated = computed(() => Boolean(currentUser.value?.id))
  const memberDisplayName = computed(() => {
    if (!currentUser.value) {
      return 'Coffee Club Member'
    }

    const fullName = [currentUser.value.firstName, currentUser.value.lastName].filter(Boolean).join(' ')
    return fullName || currentUser.value.name || currentUser.value.email || 'Coffee Club Member'
  })

  async function login(credentials) {
    const member = await loginMember(credentials)
    currentUser.value = member
    hasRestoredSession.value = true
    return member
  }

  async function logout() {
    await logoutMember()
    currentUser.value = null
    hasRestoredSession.value = true
  }

  async function restoreSession() {
    if (hasRestoredSession.value || isRestoringSession.value) {
      return currentUser.value
    }

    isRestoringSession.value = true

    try {
      currentUser.value = await restoreStoredSession()
      hasRestoredSession.value = true
      return currentUser.value
    } finally {
      isRestoringSession.value = false
    }
  }

  return {
    currentUser,
    hasRestoredSession,
    isRestoringSession,
    isAuthenticated,
    memberDisplayName,
    login,
    logout,
    restoreSession,
  }
})
