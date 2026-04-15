<script setup>
defineProps({
  title: {
    type: String,
    default: 'Nothing here yet',
  },
  description: {
    type: String,
    default: 'New content will appear here when available.',
  },
})
</script>

<template>
  <div class="state-card state-card--empty">
    <div>
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>
  </div>
</template>
