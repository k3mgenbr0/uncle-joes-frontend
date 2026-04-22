<script setup>
import BaseCard from './BaseCard.vue'
import { isStoreOrderable } from '../services/locationsService'
import { formatPhone, formatStoreLabel } from '../utils/formatters'

const props = defineProps({
  location: {
    type: Object,
    required: true,
  },
  expanded: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <BaseCard class="location-card">
    <div class="card-topline">
      <span v-if="props.location.state" class="badge">{{ props.location.state }}</span>
      <span
        v-if="!isStoreOrderable(props.location) && props.location.availabilityMessage"
        class="location-card__status"
      >
        {{ props.location.availabilityMessage }}
      </span>
      <strong
        v-else-if="
          props.location.city
          && !String(props.location.displayName || '').toLowerCase().startsWith(String(props.location.city).toLowerCase())
        "
      >
        {{ props.location.city }}
      </strong>
    </div>

    <h3>{{ formatStoreLabel(props.location) }}</h3>
    <p v-if="props.location.address" class="card-copy">{{ props.location.address }}</p>

    <dl v-if="props.location.hoursTodayLabel || props.location.hoursLabel || props.location.phone" class="info-grid info-grid--single">
      <div v-if="props.location.hoursTodayLabel || props.location.hoursLabel">
        <dt>Hours</dt>
        <dd>{{ props.location.hoursTodayLabel || props.location.hoursLabel }}</dd>
      </div>
      <div v-if="props.location.phone">
        <dt>Phone</dt>
        <dd>{{ formatPhone(props.location.phone) }}</dd>
      </div>
    </dl>

    <RouterLink
      v-if="props.location.id"
      class="card-link"
      :to="{ name: 'location-detail', params: { locationId: props.location.id } }"
    >
      View details
    </RouterLink>
    <span v-else class="card-link card-link--disabled">Details unavailable</span>
  </BaseCard>
</template>
