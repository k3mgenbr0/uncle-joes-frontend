<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppNavbar from './components/AppNavbar.vue'
import AppFooter from './components/AppFooter.vue'

const router = useRouter()
const route = useRoute()
const isRouteLoading = ref(true)
let hideLoaderTimeout = null

function clearLoaderTimeout() {
  if (hideLoaderTimeout) {
    clearTimeout(hideLoaderTimeout)
    hideLoaderTimeout = null
  }
}

function showRouteLoader() {
  clearLoaderTimeout()
  isRouteLoading.value = true
}

function hideRouteLoader() {
  clearLoaderTimeout()
  hideLoaderTimeout = setTimeout(() => {
    isRouteLoading.value = false
  }, 220)
}

const removeBeforeEach = router.beforeEach(() => {
  showRouteLoader()
  return true
})

const removeAfterEach = router.afterEach(() => {
  hideRouteLoader()
})

onMounted(async () => {
  try {
    const hasVisitedApp = window.sessionStorage.getItem('uncle-joes-initial-visit')

    if (!hasVisitedApp) {
      window.sessionStorage.setItem('uncle-joes-initial-visit', 'true')

      if (route.path !== '/') {
        await router.replace('/')
      }
    } else if (!route.name && route.path !== '/') {
      await router.replace('/')
    }
  } catch {
    if (!route.name && route.path !== '/') {
      await router.replace('/')
    }
  }

  await router.isReady()
  hideRouteLoader()
})

onBeforeUnmount(() => {
  clearLoaderTimeout()
  removeBeforeEach()
  removeAfterEach()
})
</script>

<template>
  <div class="app-shell">
    <AppNavbar />
    <main class="app-main">
      <RouterView />
    </main>
    <AppFooter />

    <transition name="route-loader-fade">
      <div v-if="isRouteLoading" class="route-loader" aria-live="polite" aria-label="Loading page">
        <div class="route-loader__card">
          <div class="route-loader__bean" aria-hidden="true"></div>
          <span class="route-loader__label">Pouring your next page…</span>
        </div>
      </div>
    </transition>
  </div>
</template>
