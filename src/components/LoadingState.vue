<script setup>
defineProps({
  title: {
    type: String,
    default: 'Loading',
  },
  description: {
    type: String,
    default: 'Please wait while we load your content.',
  },
  compact: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div :class="['state-card', { 'state-card--compact': compact }]">
    <div class="state-card__bean route-loader__bean" aria-hidden="true"></div>
    <div class="state-card__content">
      <span class="state-card__eyebrow">Loading</span>
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>
  </div>
</template>
