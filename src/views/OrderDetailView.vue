<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import BaseButton from '../components/BaseButton.vue'
import { fetchOrderDetail } from '../services/membersService'

const route = useRoute()
const order = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')

const orderId = computed(() => route.params.orderId)

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value || 0)
}

function formatDate(value) {
  if (!value) {
    return 'Date unavailable'
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}

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
    document.title = `Order ${currentOrder.id} | Uncle Joe's Coffee Company`
  }
})

onMounted(loadOrder)
</script>

<template>
  <section class="section">
    <div class="container detail-page">
      <RouterLink class="back-link" :to="{ name: 'dashboard' }">← Back to dashboard</RouterLink>

      <LoadingState
        v-if="isLoading"
        title="Loading order details"
        description="Fetching your receipt and item breakdown."
      />

      <ErrorState
        v-else-if="errorMessage"
        title="Order unavailable"
        :message="errorMessage"
        action-label="Try Again"
        @action="loadOrder"
      />

      <div v-else-if="order" class="detail-layout">
        <BaseCard class="detail-hero-card" padding="lg">
          <div class="card-topline">
            <span class="badge">Order {{ order.id }}</span>
            <span class="price-tag">{{ formatCurrency(order.total) }}</span>
          </div>

          <h1>{{ order.locationName || [order.city, order.state].filter(Boolean).join(', ') || 'Store unavailable' }}</h1>
          <p class="detail-lead">{{ formatDate(order.date) }}</p>

          <div class="detail-grid">
            <div>
              <span class="detail-label">Subtotal</span>
              <strong>{{ formatCurrency(order.itemsSubtotal) }}</strong>
            </div>
            <div>
              <span class="detail-label">Discount</span>
              <strong>{{ formatCurrency(order.discount) }}</strong>
            </div>
            <div>
              <span class="detail-label">Tax</span>
              <strong>{{ formatCurrency(order.tax) }}</strong>
            </div>
            <div>
              <span class="detail-label">Points Earned</span>
              <strong>{{ order.pointsEarned || 0 }}</strong>
            </div>
            <div>
              <span class="detail-label">Points Redeemed</span>
              <strong>{{ order.pointsRedeemed || 0 }}</strong>
            </div>
            <div>
              <span class="detail-label">Store ID</span>
              <strong>{{ order.storeId || 'Unavailable' }}</strong>
            </div>
          </div>
        </BaseCard>

        <div class="detail-sidebar">
          <BaseCard padding="lg">
            <p class="eyebrow">Items</p>
            <h2>Receipt breakdown</h2>
            <div v-if="order.items.length" class="orders-stack">
              <div v-for="item in order.items" :key="item.id" class="order-line">
                <span>
                  {{ item.quantity }}x {{ item.name }}
                  <small v-if="item.size">({{ item.size }})</small>
                </span>
                <strong>{{ formatCurrency(item.lineTotal || item.price) }}</strong>
              </div>
            </div>
            <p v-else class="detail-lead">No line items are available for this order.</p>
          </BaseCard>

          <BaseCard padding="lg">
            <p class="eyebrow">Payment</p>
            <h2>Summary</h2>
            <div class="detail-stack">
              <p class="detail-lead">Total: {{ formatCurrency(order.total) }}</p>
              <p class="detail-lead">
                Payment method:
                {{ order.paymentSummary?.payment_method || order.paymentSummary?.method || 'Unavailable' }}
              </p>
              <p class="detail-lead">
                Status:
                {{ order.paymentSummary?.status || 'Unavailable' }}
              </p>
            </div>
            <RouterLink :to="{ name: 'menu' }">
              <BaseButton variant="secondary">Order Again Inspiration</BaseButton>
            </RouterLink>
          </BaseCard>
        </div>
      </div>
    </div>
  </section>
</template>
