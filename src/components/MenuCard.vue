<script setup>
import BaseCard from './BaseCard.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['select'])
</script>

<template>
  <BaseCard class="menu-card">
    <div class="card-topline">
      <span class="badge">{{ props.item.category }}</span>
      <span class="price-tag">${{ props.item.price.toFixed(2) }}</span>
    </div>
    <h3>{{ props.item.name }}</h3>
    <p class="card-copy">{{ props.item.description || 'Freshly prepared and ready for your next coffee break.' }}</p>
    <dl class="info-grid">
      <div>
        <dt>Size</dt>
        <dd>{{ props.item.size }}</dd>
      </div>
      <div>
        <dt>Calories</dt>
        <dd>{{ props.item.calories ?? 'N/A' }}</dd>
      </div>
    </dl>
    <button class="card-link" type="button" @click="emit('select', props.item)">
      View details
    </button>
  </BaseCard>
</template>
