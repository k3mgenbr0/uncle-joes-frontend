<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import { fetchOrderDetail } from '../services/membersService'
import { formatCurrency, formatDateTime, formatStoreLabel } from '../utils/formatters'

const route = useRoute()
const order = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')

const orderId = computed(() => route.params.orderId)

async function loadOrder() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    order.value = await fetchOrderDetail(orderId.value)
  } catch (error) {
    errorMessage.value = error.message
    order.value = null
  } finally {
    isLoading.value = false
  }
}

watch(orderId, loadOrder)
watch(order, (currentOrder) => {
  if (currentOrder?.id) {
    document.title = `Order Confirmed | Uncle Joe's Coffee Company`
  }
})

onMounted(loadOrder)
</script>

<template>
  <section class="section">
    <div class="container detail-page">
      <RouterLink class="back-link" :to="{ name: 'orders' }">← Back to orders</RouterLink>

      <LoadingState
        v-if="isLoading"
        title="Loading confirmation"
        description="Pulling together your pickup summary."
      />

      <ErrorState
        v-else-if="errorMessage"
        title="Confirmation unavailable"
        :message="errorMessage"
        action-label="Try Again"
        @action="loadOrder"
      />

      <div v-else-if="order" class="detail-layout">
        <BaseCard class="detail-hero-card" padding="lg">
          <p class="eyebrow">Order Confirmed</p>
          <div class="card-topline">
            <span class="badge">Pickup Order</span>
            <span class="price-tag">{{ formatCurrency(order.total) }}</span>
          </div>

          <h1>Your order is in</h1>
          <p class="detail-lead">
            {{ formatStoreLabel(order.locationName, order.city, order.state) }}
          </p>
          <p class="detail-lead">{{ formatDateTime(order.date) }}</p>

          <div class="detail-grid">
            <div class="detail-grid__item">
              <span class="detail-label">Order Number</span>
              <strong class="detail-value">{{ order.id }}</strong>
            </div>
            <div class="detail-grid__item">
              <span class="detail-label">Pickup Total</span>
              <strong class="detail-value">{{ formatCurrency(order.total) }}</strong>
            </div>
            <div class="detail-grid__item">
              <span class="detail-label">Points Earned</span>
              <strong class="detail-value">{{ order.pointsEarned || 0 }}</strong>
            </div>
            <div class="detail-grid__item">
              <span class="detail-label">Payment</span>
              <strong class="detail-value">Pay in store</strong>
            </div>
          </div>

          <div class="hero-actions">
            <RouterLink :to="{ name: 'order-detail', params: { orderId: order.id } }">
              <BaseButton variant="secondary">View Order Details</BaseButton>
            </RouterLink>
            <RouterLink :to="{ name: 'orders' }">
              <BaseButton variant="ghost">Start Another Order</BaseButton>
            </RouterLink>
          </div>
        </BaseCard>

        <BaseCard padding="lg">
          <p class="eyebrow">What You Ordered</p>
          <h2>Pickup summary</h2>

          <div v-if="order.items.length" class="orders-stack">
            <div v-for="item in order.items" :key="item.id" class="order-line">
              <span>
                {{ item.quantity }}x {{ item.name }}
                <small v-if="item.size">({{ item.size }})</small>
              </span>
              <strong>{{ formatCurrency(item.lineTotal || item.price) }}</strong>
            </div>
          </div>
          <p v-else class="detail-lead">Line items were not included for this order.</p>
        </BaseCard>
      </div>
    </div>
  </section>
</template>
