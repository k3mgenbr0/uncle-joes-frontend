<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
  },
  size: {
    type: String,
    default: 'md',
  },
  type: {
    type: String,
    default: 'button',
  },
  block: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled"
    :class="['base-button', `base-button--${props.variant}`, `base-button--${props.size}`, { 'base-button--block': props.block }]"
  >
    <slot />
  </button>
</template>
