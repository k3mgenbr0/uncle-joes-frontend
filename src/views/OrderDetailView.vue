<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import BaseButton from '../components/BaseButton.vue'
import { fetchOrderDetail } from '../services/membersService'
import { formatCurrency, formatDateTime, formatOrderStatus, formatPaymentMethod, formatPaymentStatus, formatPhone, formatShortOrderId, formatStoreLabel } from '../utils/formatters'

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
            <span class="badge">Order {{ formatShortOrderId(order.id) }}</span>
            <span class="price-tag">{{ formatCurrency(order.total) }}</span>
          </div>

          <h1>{{ formatStoreLabel(order.locationName, order.city, order.state) }}</h1>
          <p class="detail-lead">{{ order.pickupTime ? `Pickup around ${formatDateTime(order.pickupTime)}` : `Ordered ${formatDateTime(order.date)}` }}</p>

          <div class="favorite-link order-callout">
            <strong>
              {{ order.readyByEstimate ? `Ready by ${formatDateTime(order.readyByEstimate)}` : formatOrderStatus(order.orderStatus) }}
            </strong>
            <span>
              {{ order.storePhone ? `Store phone: ${formatPhone(order.storePhone)}` : 'Pay in store when you arrive.' }}
            </span>
          </div>

          <div class="detail-grid">
            <div class="detail-grid__item" v-if="order.pickupTime">
              <span class="detail-label">Pickup Time</span>
              <strong class="detail-value">{{ formatDateTime(order.pickupTime) }}</strong>
            </div>
            <div class="detail-grid__item" v-if="order.readyByEstimate">
              <span class="detail-label">Ready By</span>
              <strong class="detail-value">{{ formatDateTime(order.readyByEstimate) }}</strong>
            </div>
            <div class="detail-grid__item" v-if="order.orderStatus">
              <span class="detail-label">Status</span>
              <strong class="detail-value">{{ formatOrderStatus(order.orderStatus) }}</strong>
            </div>
            <div class="detail-grid__item" v-if="order.estimatedPrepMinutes !== null && order.estimatedPrepMinutes !== undefined">
              <span class="detail-label">Estimated Prep</span>
              <strong class="detail-value">{{ order.estimatedPrepMinutes }} min</strong>
            </div>
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
            <div v-if="order.storePhone" class="detail-grid__item">
              <span class="detail-label">Store Phone</span>
              <strong class="detail-value">{{ formatPhone(order.storePhone) }}</strong>
            </div>
            <div v-if="order.specialInstructions" class="detail-grid__item">
              <span class="detail-label">Instructions</span>
              <strong class="detail-value">{{ order.specialInstructions }}</strong>
            </div>
          </div>
        </BaseCard>

        <div class="detail-sidebar">
          <BaseCard padding="lg">
            <p class="eyebrow">Items</p>
            <h2>Receipt breakdown</h2>
            <div v-if="order.items.length" class="orders-stack">
              <div v-for="item in order.items" :key="item.id" class="order-line">
                <span class="order-line__content">
                  <strong>{{ item.name }}</strong>
                  <small>{{ [item.size, `${item.quantity} item${item.quantity > 1 ? 's' : ''}`].filter(Boolean).join(' • ') }}</small>
                </span>
                <strong>{{ formatCurrency(item.lineTotal || item.price) }}</strong>
              </div>
            </div>
            <p v-else class="detail-lead">No line items are available for this order.</p>
          </BaseCard>

          <BaseCard v-if="order.paymentSummary" padding="lg">
            <p class="eyebrow">Payment</p>
            <h2>Summary</h2>
            <div class="detail-stack">
              <p class="detail-lead">Total: {{ formatCurrency(order.total) }}</p>
              <p class="detail-lead">
                Payment method: {{ formatPaymentMethod(order.paymentSummary?.payment_method || order.paymentSummary?.method || 'pay_in_store') }}
              </p>
              <p class="detail-lead">
                Payment status: {{ formatPaymentStatus(order.paymentSummary?.status) }}
              </p>
            </div>
            <RouterLink :to="{ name: 'menu' }">
              <BaseButton variant="secondary">Browse Menu Again</BaseButton>
            </RouterLink>
          </BaseCard>
        </div>
      </div>
    </div>
  </section>
</template>
