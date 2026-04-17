<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import OrderHistory from '../components/OrderHistory.vue'
import DashboardPoints from '../components/DashboardPoints.vue'
import { fetchSessionMemberOrders, fetchSessionMemberPoints } from '../services/membersService'
import { useAuthStore } from '../stores/auth'
import { formatCurrency, formatDateTime } from '../utils/formatters'

const authStore = useAuthStore()
const orders = ref([])
const points = ref(0)
const ordersLoading = ref(true)
const pointsLoading = ref(true)
const ordersError = ref('')
const pointsError = ref('')

const pointsHistory = computed(() =>
  orders.value.map((order) => ({
    id: order.id,
    date: order.date,
    points: order.pointsEarned || Math.floor(order.total || 0),
    total: order.total,
  })),
)

async function loadOrders() {
  ordersLoading.value = true
  ordersError.value = ''

  try {
    orders.value = await fetchSessionMemberOrders({ includeItems: true, limit: 50 })
  } catch (error) {
    ordersError.value = error.message
  } finally {
    ordersLoading.value = false
  }
}

async function loadPoints() {
  pointsLoading.value = true
  pointsError.value = ''

  try {
    const result = await fetchSessionMemberPoints()
    points.value = result.value
  } catch (error) {
    pointsError.value = error.message
  } finally {
    pointsLoading.value = false
  }
}

onMounted(() => {
  loadOrders()
  loadPoints()
})
</script>

<template>
  <section class="section">
    <div class="container dashboard-stack">
      <div class="section-heading section-heading--left">
        <span class="eyebrow">Coffee Club</span>
        <h1>Your Orders</h1>
        <p>Review your past visits, totals, and Coffee Club points earned from each order.</p>
      </div>

      <div class="dashboard-hero-grid">
        <DashboardPoints
          :points="points"
          :is-loading="pointsLoading"
          :error-message="pointsError"
          @retry="loadPoints"
        />

        <BaseCard padding="lg">
          <p class="eyebrow">Points History</p>
          <h2>Earned by order</h2>
          <div v-if="ordersLoading" class="detail-lead">Loading points history...</div>
          <div v-else-if="ordersError" class="helper-text helper-text--error">{{ ordersError }}</div>
          <div v-else-if="pointsHistory.length" class="favorites-list">
            <div v-for="entry in pointsHistory" :key="entry.id" class="favorite-link">
              <strong>{{ formatDateTime(entry.date) }}</strong>
              <span>{{ entry.points }} points • {{ formatCurrency(entry.total) }}</span>
            </div>
          </div>
        </BaseCard>
      </div>

      <OrderHistory
        :orders="orders"
        :is-loading="ordersLoading"
        :error-message="ordersError"
        @retry="loadOrders"
      />

      <BaseCard padding="lg">
        <p class="eyebrow">Pickup Ordering</p>
        <h2>Pay in store</h2>
        <p class="detail-lead">
          The menu, locations, and member order history are connected. Order submission is ready to wire up once the backend exposes a create-order endpoint.
        </p>
        <div class="hero-actions">
          <RouterLink to="/menu">
            <BaseButton>Browse Menu</BaseButton>
          </RouterLink>
          <RouterLink to="/locations">
            <BaseButton variant="secondary">Choose a Store</BaseButton>
          </RouterLink>
        </div>
      </BaseCard>
    </div>
  </section>
</template>
