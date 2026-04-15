<script setup>
const model = defineModel({
  type: [String, Number],
  default: '',
})

defineProps({
  id: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
  autocomplete: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <label class="input-group">
    <span v-if="label" class="input-label">{{ label }}</span>
    <input
      :id="id || undefined"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :autocomplete="autocomplete || undefined"
      :required="required"
      class="base-input"
    />
  </label>
</template>
