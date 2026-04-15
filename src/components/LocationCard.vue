<script setup>
import BaseCard from './BaseCard.vue'

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
      <span class="badge">{{ props.location.state || 'Location' }}</span>
      <strong>{{ props.location.city || props.location.name || 'Uncle Joe\'s Coffee' }}</strong>
    </div>

    <h3>{{ props.location.name || `${props.location.city}, ${props.location.state}` }}</h3>
    <p class="card-copy">{{ props.location.address || 'Address unavailable' }}</p>

    <dl class="info-grid info-grid--single">
      <div>
        <dt>Hours</dt>
        <dd>{{ props.location.hoursTodayLabel || props.location.hoursLabel || 'Hours unavailable' }}</dd>
      </div>
      <div v-if="props.location.phone">
        <dt>Phone</dt>
        <dd>{{ props.location.phone }}</dd>
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
