<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import LoginForm from '../components/LoginForm.vue'

const route = useRoute()
const redirectMessage = computed(() =>
  route.query.redirect ? 'Sign in to access your Coffee Club dashboard.' : 'Use your Coffee Club credentials to continue.',
)
</script>

<template>
  <section class="section">
    <div class="container auth-container">
      <div class="section-heading section-heading--left">
        <span class="eyebrow">Member Access</span>
        <h1>Coffee Club Login</h1>
        <p>{{ redirectMessage }}</p>
      </div>

      <BaseCard class="auth-card" padding="lg">
        <LoginForm />
      </BaseCard>
    </div>
  </section>
</template>
