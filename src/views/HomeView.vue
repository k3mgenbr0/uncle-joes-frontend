<script setup>
import { computed } from 'vue'
import BaseButton from '../components/BaseButton.vue'
import BaseCard from '../components/BaseCard.vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const memberPrimaryCta = computed(() => (authStore.isAuthenticated ? '/orders' : '/login'))
const memberPrimaryLabel = computed(() => (authStore.isAuthenticated ? 'View Orders' : 'Member Login'))

const benefits = [
  {
    title: 'Earn Points Faster',
    description: 'Every coffee run gets you closer to rewards, free drinks, and members-only surprises.',
  },
  {
    title: 'Track Every Visit',
    description: 'Review your recent orders and keep an eye on your favorite morning routine.',
  },
  {
    title: 'Stay Close to Home',
    description: 'Find the nearest Uncle Joe\'s location and discover the hours before you head out.',
  },
]
</script>

<template>
  <div>
    <section class="hero-section">
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">Warm coffee. Better mornings.</span>
          <h1>Uncle Joe's Coffee Company</h1>
          <p>
            Sip your way through handcrafted favorites, discover neighborhood locations,
            and keep your Coffee Club perks close at hand.
          </p>

          <div class="hero-actions">
            <RouterLink to="/menu">
              <BaseButton>Browse Menu</BaseButton>
            </RouterLink>
            <RouterLink to="/locations">
              <BaseButton variant="secondary">Find Locations</BaseButton>
            </RouterLink>
            <RouterLink :to="memberPrimaryCta">
              <BaseButton variant="ghost">{{ memberPrimaryLabel }}</BaseButton>
            </RouterLink>
          </div>
        </div>

        <BaseCard class="hero-feature-card" padding="lg">
          <p class="feature-overline">Coffee Club</p>
          <h2>Rewards that feel like your regular order knows your name.</h2>
          <p>
            Sign in to view your points balance, revisit your recent orders, and stay connected to the Uncle Joe's experience.
          </p>
          <ul class="feature-list">
            <li>Member dashboard with points and orders</li>
            <li>Fast access to nearby stores</li>
            <li>Fresh menu browsing on any device</li>
          </ul>
        </BaseCard>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-heading">
          <span class="eyebrow">Why Join</span>
          <h2>Brewed for loyal regulars</h2>
          <p>
            The Coffee Club keeps your favorite shop moments easy to revisit, from points tracking to order history.
          </p>
        </div>

        <div class="benefits-grid">
          <BaseCard
            v-for="benefit in benefits"
            :key="benefit.title"
            class="benefit-card"
          >
            <h3>{{ benefit.title }}</h3>
            <p>{{ benefit.description }}</p>
          </BaseCard>
        </div>
      </div>
    </section>
  </div>
</template>
