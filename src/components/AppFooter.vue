<script setup>
import logoHorizontal from '../assets/branding/logo-horizontal.png'
</script>

<template>
  <footer class="site-footer">
    <div class="container footer-row">
      <div class="footer-brand">
        <img :src="logoHorizontal" alt="Uncle Joe's Coffee" class="footer-brand__image" />
        <p>Neighborhood coffee, easy rewards, and a warm welcome every time.</p>
      </div>

      <div class="footer-links">
        <RouterLink to="/menu">Menu</RouterLink>
        <RouterLink to="/locations">Locations</RouterLink>
        <RouterLink to="/orders">Orders</RouterLink>
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/login">Coffee Club</RouterLink>
      </div>
    </div>
  </footer>
</template>
