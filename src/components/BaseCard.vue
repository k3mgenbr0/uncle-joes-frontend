<script setup>
const props = defineProps({
  padding: {
    type: String,
    default: 'md',
  },
})
</script>

<template>
  <article :class="['base-card', `base-card--${props.padding}`]">
    <slot />
  </article>
</template>
