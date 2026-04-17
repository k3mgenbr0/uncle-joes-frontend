<script setup>
import { computed } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import { useAuthStore } from '../stores/auth'
import { formatDate, formatMonthDay, formatPhone, formatStoreLabel } from '../utils/formatters'

const authStore = useAuthStore()
const preferredStore = computed(() => authStore.currentUser?.preferredStore ?? null)
</script>

<template>
  <section class="section">
    <div class="container dashboard-stack">
      <div class="section-heading section-heading--left">
        <span class="eyebrow">Coffee Club</span>
        <h1>Member Profile</h1>
        <p>Your Coffee Club details and home-store information, all in one place.</p>
      </div>

      <div class="dashboard-hero-grid">
        <BaseCard class="member-card" padding="lg">
          <p class="eyebrow">Profile</p>
          <h2>{{ authStore.memberDisplayName }}</h2>
          <dl class="member-details">
            <div v-if="authStore.currentUser?.email">
              <dt>Email</dt>
              <dd>{{ authStore.currentUser.email }}</dd>
            </div>
            <div v-if="authStore.currentUser?.raw?.phone_number">
              <dt>Phone</dt>
              <dd>{{ formatPhone(authStore.currentUser.raw.phone_number) }}</dd>
            </div>
            <div v-if="authStore.currentUser?.tier">
              <dt>Rewards Tier</dt>
              <dd>{{ authStore.currentUser.tier }}</dd>
            </div>
            <div v-if="authStore.currentUser?.joinDate">
              <dt>Join Date</dt>
              <dd>{{ formatDate(authStore.currentUser.joinDate) }}</dd>
            </div>
            <div v-if="authStore.currentUser?.birthdayMonthDay">
              <dt>Birthday</dt>
              <dd>{{ formatMonthDay(authStore.currentUser.birthdayMonthDay) }}</dd>
            </div>
          </dl>
        </BaseCard>

        <BaseCard v-if="preferredStore" class="member-card" padding="lg">
          <p class="eyebrow">Home Store</p>
          <h2>{{ formatStoreLabel(preferredStore?.store_name, preferredStore?.city, preferredStore?.state) }}</h2>
          <p v-if="preferredStore?.full_address" class="detail-lead">{{ preferredStore.full_address }}</p>
          <p v-if="preferredStore?.phone" class="detail-lead">Phone: {{ formatPhone(preferredStore.phone) }}</p>
        </BaseCard>
      </div>
    </div>
  </section>
</template>
