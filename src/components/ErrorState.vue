<script setup>
import BaseButton from './BaseButton.vue'

defineProps({
  title: {
    type: String,
    default: 'Something went wrong',
  },
  message: {
    type: String,
    default: 'Please try again in a moment.',
  },
  actionLabel: {
    type: String,
    default: '',
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['action'])
</script>

<template>
  <div :class="['state-card state-card--error', { 'state-card--compact': compact }]">
    <div class="state-card__content">
      <span class="state-card__eyebrow">Needs attention</span>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <BaseButton v-if="actionLabel" variant="secondary" @click="emit('action')">
        {{ actionLabel }}
      </BaseButton>
    </div>
  </div>
</template>
