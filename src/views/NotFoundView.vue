<script setup>
import BaseButton from '../components/BaseButton.vue'
</script>

<template>
  <section class="section">
    <div class="container">
      <div class="not-found">
        <span class="eyebrow">404</span>
        <h1>That page wandered off with the morning rush.</h1>
        <p>Let’s get you back to fresh coffee, store info, or your member dashboard.</p>
        <div class="hero-actions">
          <RouterLink to="/">
            <BaseButton>Go Home</BaseButton>
          </RouterLink>
          <RouterLink to="/menu">
            <BaseButton variant="secondary">Browse Menu</BaseButton>
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>
