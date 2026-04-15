<script setup>
import BaseCard from './BaseCard.vue'
import LoadingState from './LoadingState.vue'
import ErrorState from './ErrorState.vue'
import EmptyState from './EmptyState.vue'

defineProps({
  orders: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['retry'])

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
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString()
}
</script>

<template>
  <BaseCard padding="lg">
    <div class="section-heading section-heading--left section-heading--compact">
      <span class="eyebrow">Recent Orders</span>
      <h2>Your Order History</h2>
    </div>

    <LoadingState
      v-if="isLoading"
      title="Loading order history"
      description="Gathering your most recent visits."
    />

    <ErrorState
      v-else-if="errorMessage"
      title="Order history unavailable"
      :message="errorMessage"
      action-label="Try Again"
      @action="emit('retry')"
    />

    <EmptyState
      v-else-if="!orders.length"
      title="No orders yet"
      description="Once your Coffee Club purchases appear, they will show up here."
    />

    <div v-else class="orders-stack">
      <article
        v-for="order in orders"
        :key="order.id || order.date"
        class="order-card"
      >
        <div class="order-header">
          <div>
            <h3>{{ formatDate(order.date) }}</h3>
            <p>{{ order.locationName || [order.city, order.state].filter(Boolean).join(', ') || 'Location unavailable' }}</p>
          </div>
          <strong>{{ formatCurrency(order.total) }}</strong>
        </div>

        <div v-if="order.items.length" class="order-items">
          <div
            v-for="item in order.items"
            :key="`${order.id}-${item.id}-${item.size}`"
            class="order-line"
          >
            <span>{{ item.quantity }}x {{ item.name }} <small>({{ item.size }})</small></span>
            <span>{{ formatCurrency(item.price) }}</span>
          </div>
        </div>

        <RouterLink
          v-if="order.id"
          class="card-link"
          :to="{ name: 'order-detail', params: { orderId: order.id } }"
        >
          View order details
        </RouterLink>
      </article>
    </div>
  </BaseCard>
</template>
