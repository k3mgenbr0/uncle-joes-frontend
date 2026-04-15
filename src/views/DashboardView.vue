<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import DashboardPoints from '../components/DashboardPoints.vue'
import OrderHistory from '../components/OrderHistory.vue'
import { useAuthStore } from '../stores/auth'
import { fetchMemberOrders, fetchMemberPoints } from '../services/membersService'

const authStore = useAuthStore()

const points = ref(0)
const orders = ref([])
const pointsLoading = ref(true)
const ordersLoading = ref(true)
const pointsError = ref('')
const ordersError = ref('')

const memberSummary = computed(() => authStore.currentUser?.raw ?? {})

async function loadPoints() {
  pointsLoading.value = true
  pointsError.value = ''

  try {
    const result = await fetchMemberPoints(authStore.currentUser.id)
    points.value = result.value
  } catch (error) {
    pointsError.value = error.message
  } finally {
    pointsLoading.value = false
  }
}

async function loadOrders() {
  ordersLoading.value = true
  ordersError.value = ''

  try {
    orders.value = await fetchMemberOrders(authStore.currentUser.id)
  } catch (error) {
    ordersError.value = error.message
  } finally {
    ordersLoading.value = false
  }
}

onMounted(() => {
  loadPoints()
  loadOrders()
})
</script>

<template>
  <section class="section">
    <div class="container dashboard-stack">
      <div class="section-heading section-heading--left">
        <span class="eyebrow">Coffee Club</span>
        <h1>Welcome back, {{ authStore.memberDisplayName }}</h1>
        <p>Keep up with your rewards and revisit your latest coffee runs in one place.</p>
      </div>

      <div class="dashboard-hero-grid">
        <DashboardPoints
          :points="points"
          :is-loading="pointsLoading"
          :error-message="pointsError"
          @retry="loadPoints"
        />

        <BaseCard class="member-card" padding="lg">
          <p class="eyebrow">Member Details</p>
          <h2>{{ authStore.memberDisplayName }}</h2>
          <dl class="member-details">
            <div>
              <dt>Email</dt>
              <dd>{{ authStore.currentUser?.email || 'Unavailable' }}</dd>
            </div>
            <div>
              <dt>Membership Tier</dt>
              <dd>{{ memberSummary.tier || memberSummary.membership_tier || authStore.currentUser?.tier || 'Standard' }}</dd>
            </div>
            <div>
              <dt>Member ID</dt>
              <dd>{{ authStore.currentUser?.id }}</dd>
            </div>
          </dl>
        </BaseCard>
      </div>

      <OrderHistory
        :orders="orders"
        :is-loading="ordersLoading"
        :error-message="ordersError"
        @retry="loadOrders"
      />
    </div>
  </section>
</template>
