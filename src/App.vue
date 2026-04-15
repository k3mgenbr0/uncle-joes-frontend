<script setup>
import AppNavbar from './components/AppNavbar.vue'
import AppFooter from './components/AppFooter.vue'
</script>

<template>
  <div class="app-shell">
    <AppNavbar />
    <main class="app-main">
      <RouterView />
    </main>
    <AppFooter />
  </div>
</template>
