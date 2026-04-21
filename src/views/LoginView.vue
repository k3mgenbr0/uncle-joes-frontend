<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import LoginForm from '../components/LoginForm.vue'
import logoStacked from '../assets/branding/logo-stacked.png'

const route = useRoute()
const redirectMessage = computed(() =>
  route.query.redirect ? 'Sign in to access your Coffee Club dashboard.' : 'Use your Coffee Club credentials to continue.',
)

const accessHighlights = [
  'Track points, tier progress, and milestone rewards',
  'Reorder your saved favorites in just a few taps',
  'Keep pickup orders, store details, and rewards in one place',
]
</script>

<template>
  <section class="section">
    <div class="container auth-container auth-layout">
      <BaseCard class="auth-brand-card" padding="lg">
        <img :src="logoStacked" alt="Uncle Joe's Coffee badge" class="auth-brand-card__logo" />
        <div class="section-heading section-heading--left section-heading--compact">
          <span class="eyebrow">Member Access</span>
          <h1>Coffee Club Login</h1>
          <p>{{ redirectMessage }}</p>
        </div>
        <ul class="feature-list auth-feature-list">
          <li v-for="highlight in accessHighlights" :key="highlight">{{ highlight }}</li>
        </ul>
      </BaseCard>

      <BaseCard class="auth-card" padding="lg">
        <LoginForm />
      </BaseCard>
    </div>
  </section>
</template>
