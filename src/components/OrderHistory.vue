<script setup>
import BaseCard from './BaseCard.vue'
import LoadingState from './LoadingState.vue'
import ErrorState from './ErrorState.vue'
import EmptyState from './EmptyState.vue'
import { formatCurrency, formatDate, formatDateTime, formatOrderStatus, formatStoreLabel } from '../utils/formatters'

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
  eyebrow: {
    type: String,
    default: 'Recent Orders',
  },
  title: {
    type: String,
    default: 'Your Order History',
  },
})

const emit = defineEmits(['retry'])
</script>

<template>
  <BaseCard class="panel-card panel-card--history" padding="lg">
    <div class="section-heading section-heading--left section-heading--compact">
      <span class="eyebrow">{{ eyebrow }}</span>
      <h2>{{ title }}</h2>
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
            <p>{{ formatStoreLabel(order.locationName, order.city, order.state) }}</p>
            <p v-if="order.orderStatus || order.pickupTime">
              <template v-if="order.orderStatus">{{ formatOrderStatus(order.orderStatus) }}</template>
              <template v-if="order.orderStatus && order.pickupTime"> • </template>
              <template v-if="order.pickupTime">Pickup {{ formatDateTime(order.pickupTime) }}</template>
            </p>
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
