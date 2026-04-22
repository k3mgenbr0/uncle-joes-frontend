<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import LoginForm from '../components/LoginForm.vue'
import logoIcon from '../assets/branding/logo-icon.png'

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
        <div class="detail-brand-row detail-brand-row--compact">
          <img :src="logoIcon" alt="Uncle Joe's Coffee icon" class="detail-brand-row__logo" />
          <div>
            <span class="eyebrow">Member Access</span>
            <strong class="detail-brand-row__title">Uncle Joe's Coffee Club</strong>
          </div>
        </div>
        <div class="section-heading section-heading--left section-heading--compact">
          <h1>Coffee Club Login</h1>
          <p>{{ redirectMessage }}</p>
        </div>
        <div class="auth-brand-card__note">
          <strong>Rewards, reorders, and pickup in one place.</strong>
          <span>Use your Coffee Club sign-in to check points, save favorites, and place pickup orders faster.</span>
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
