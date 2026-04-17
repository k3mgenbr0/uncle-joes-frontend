<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from './BaseButton.vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const isMenuOpen = ref(false)

const navLinks = computed(() => [
  { name: 'Home', to: '/' },
  { name: 'Menu', to: '/menu' },
  { name: 'Locations', to: '/locations' },
  ...(authStore.isAuthenticated
    ? [
        { name: 'Orders', to: '/orders' },
        { name: 'Profile', to: '/profile' },
        { name: 'Dashboard', to: '/dashboard' },
      ]
    : []),
])

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

async function handleLogout() {
  await authStore.logout()
  closeMenu()
  router.push('/')
}
</script>

<template>
  <header class="site-header">
    <div class="container header-row">
      <RouterLink to="/" class="brand-mark" @click="closeMenu">
        <span class="brand-mark__badge">UJ</span>
        <span>
          <strong>Uncle Joe's</strong>
          <small>Coffee Company</small>
        </span>
      </RouterLink>

      <button
        class="nav-toggle"
        type="button"
        :aria-expanded="isMenuOpen"
        aria-label="Toggle navigation"
        @click="toggleMenu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav :class="['nav-links', { 'nav-links--open': isMenuOpen }]">
        <RouterLink
          v-for="link in navLinks"
          :key="link.name"
          :to="link.to"
          class="nav-link"
          @click="closeMenu"
        >
          {{ link.name }}
        </RouterLink>

        <RouterLink
          v-if="!authStore.isAuthenticated"
          to="/login"
          class="nav-link nav-link--button"
          @click="closeMenu"
        >
          <BaseButton size="sm">Login</BaseButton>
        </RouterLink>

        <BaseButton
          v-else
          class="nav-link--button nav-logout"
          size="sm"
          variant="ghost"
          @click="handleLogout"
        >
          {{ authStore.currentUser?.firstName ? `${authStore.currentUser.firstName} • Logout` : 'Logout' }}
        </BaseButton>
      </nav>
    </div>
  </header>
</template>
