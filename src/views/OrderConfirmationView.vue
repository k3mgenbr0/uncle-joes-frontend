<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import { fetchOrderDetail } from '../services/membersService'
import { formatCurrency, formatDateTime, formatOrderStatus, formatPaymentMethod, formatPaymentStatus, formatPhone, formatReadyBy, formatShortOrderId, formatStoreLabel } from '../utils/formatters'
import logoIcon from '../assets/branding/logo-icon.png'

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
        <BaseCard class="detail-hero-card panel-card panel-card--soft" padding="lg">
          <div class="detail-brand-row">
            <img :src="logoIcon" alt="Uncle Joe's Coffee" class="detail-brand-row__logo" />
            <div>
              <p class="eyebrow">Order Confirmed</p>
              <strong class="detail-brand-row__title">We'll have it ready for pickup.</strong>
            </div>
          </div>
          <div class="card-topline">
            <span class="badge">Order {{ formatShortOrderId(order.id) }}</span>
            <span class="price-tag">{{ formatCurrency(order.total) }}</span>
          </div>

          <h1>Your order is in</h1>
          <p class="detail-lead">
            {{ formatStoreLabel(order.locationName, order.city, order.state) }}
          </p>
          <p class="detail-lead">
            {{ order.pickupTime ? `Pickup around ${formatDateTime(order.pickupTime)}` : `Starting now • ordered ${formatDateTime(order.date)}` }}
          </p>

          <div class="favorite-link order-callout order-callout--receipt">
            <strong>
              {{ order.readyByEstimate ? `Ready by ${formatReadyBy(order)}` : 'Your order is being prepared' }}
            </strong>
            <span>
              {{ order.storePhone ? `Questions? Call ${formatPhone(order.storePhone)}.` : 'Pay in store when you pick up your order.' }}
            </span>
          </div>

          <div class="detail-grid">
            <div class="detail-grid__item">
              <span class="detail-label">Order Number</span>
              <strong class="detail-value">{{ order.id }}</strong>
            </div>
            <div class="detail-grid__item" v-if="order.orderStatus">
              <span class="detail-label">Status</span>
              <strong class="detail-value">{{ formatOrderStatus(order.orderStatus) }}</strong>
            </div>
            <div class="detail-grid__item" v-if="order.readyByEstimate">
              <span class="detail-label">Ready By</span>
              <strong class="detail-value">{{ formatReadyBy(order) }}</strong>
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
              <strong class="detail-value">{{ formatPaymentMethod(order.paymentSummary?.payment_method || order.paymentSummary?.method || 'pay_in_store') }}</strong>
            </div>
            <div class="detail-grid__item" v-if="order.storePhone">
              <span class="detail-label">Store Phone</span>
              <strong class="detail-value">{{ formatPhone(order.storePhone) }}</strong>
            </div>
            <div class="detail-grid__item" v-if="order.specialInstructions">
              <span class="detail-label">Instructions</span>
              <strong class="detail-value">{{ order.specialInstructions }}</strong>
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

        <BaseCard class="panel-card panel-card--flat" padding="lg">
          <p class="eyebrow">What You Ordered</p>
          <h2>Pickup summary</h2>

          <div v-if="order.items.length" class="orders-stack">
            <div v-for="item in order.items" :key="item.id" class="order-line">
              <span class="order-line__content">
                <strong>{{ item.name }}</strong>
                <small>{{ [item.size, `${item.quantity} item${item.quantity > 1 ? 's' : ''}`].filter(Boolean).join(' • ') }}</small>
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
