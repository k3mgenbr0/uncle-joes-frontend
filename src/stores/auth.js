import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { loginMember, logoutMember, restoreSession as restoreStoredSession } from '../services/authService'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref(null)
  const hasRestoredSession = ref(false)

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
    return member
  }

  function logout() {
    logoutMember()
    currentUser.value = null
  }

  function restoreSession() {
    currentUser.value = restoreStoredSession()
    hasRestoredSession.value = true
  }

  return {
    currentUser,
    hasRestoredSession,
    isAuthenticated,
    memberDisplayName,
    login,
    logout,
    restoreSession,
  }
})
