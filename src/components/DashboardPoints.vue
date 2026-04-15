<script setup>
import BaseCard from './BaseCard.vue'
import LoadingState from './LoadingState.vue'
import ErrorState from './ErrorState.vue'

defineProps({
  points: {
    type: Number,
    default: 0,
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
</script>

<template>
  <BaseCard class="points-card" padding="lg">
    <p class="eyebrow">Points Balance</p>
    <LoadingState
      v-if="isLoading"
      compact
      title="Loading points"
      description="Checking your Coffee Club rewards."
    />
    <ErrorState
      v-else-if="errorMessage"
      compact
      title="Points unavailable"
      :message="errorMessage"
      action-label="Try Again"
      @action="emit('retry')"
    />
    <div v-else class="points-summary">
      <strong>{{ points }}</strong>
      <span>available reward points</span>
    </div>
  </BaseCard>
</template>
