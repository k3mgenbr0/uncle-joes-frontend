<script setup>
import logoIcon from '../assets/branding/logo-icon.png'
</script>

<template>
  <footer class="site-footer">
    <div class="container footer-row">
      <div class="footer-brand">
        <div class="footer-brand__heading">
          <img :src="logoIcon" alt="Uncle Joe's Coffee" class="footer-brand__image" />
          <div>
            <strong>Uncle Joe's Coffee</strong>
            <p>Neighborhood coffee, easy rewards, and a warm welcome every time.</p>
          </div>
        </div>
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
