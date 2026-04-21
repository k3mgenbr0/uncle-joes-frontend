<script setup>
import { computed } from 'vue'
import BaseCard from './BaseCard.vue'
import LoadingState from './LoadingState.vue'
import ErrorState from './ErrorState.vue'
import { formatTitleCase } from '../utils/formatters'

const props = defineProps({
  points: {
    type: Number,
    default: 0,
  },
  rewards: {
    type: Object,
    default: null,
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

const progressPercent = computed(() => {
  const progress = Number(props.rewards?.currentRewardProgress ?? props.points ?? 0)
  const threshold = Number(props.rewards?.nextRewardThreshold ?? 0)

  if (!threshold || threshold <= 0) {
    return 0
  }

  return Math.max(0, Math.min(100, (progress / threshold) * 100))
})
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
      <span>{{ points === 1 ? 'available reward point' : 'available reward points' }}</span>
      <div v-if="rewards?.rewardsTier || rewards?.pointsToNextReward || rewards?.nextTierName" class="points-progress">
        <div class="card-topline">
          <span v-if="rewards?.rewardsTier" class="badge">{{ formatTitleCase(rewards.rewardsTier) }}</span>
          <span v-if="rewards?.nextTierName" class="helper-text helper-text--compact">
            Next tier: {{ formatTitleCase(rewards.nextTierName) }}
          </span>
        </div>
        <div v-if="rewards?.nextRewardThreshold" class="progress-track" aria-hidden="true">
          <span class="progress-bar" :style="{ width: `${progressPercent}%` }"></span>
        </div>
        <p v-if="rewards?.pointsToNextReward" class="helper-text helper-text--compact">
          {{ rewards.pointsToNextReward }} points to your next reward
        </p>
        <p v-else-if="rewards?.nextTierName" class="helper-text helper-text--compact">
          You're on track for {{ formatTitleCase(rewards.nextTierName) }}.
        </p>
      </div>
    </div>
  </BaseCard>
</template>
