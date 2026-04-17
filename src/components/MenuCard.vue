<script setup>
import BaseCard from './BaseCard.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

</script>

<template>
  <BaseCard class="menu-card">
    <div class="card-topline">
      <span v-if="props.item.category" class="badge">{{ props.item.category }}</span>
      <span class="price-tag">${{ props.item.price.toFixed(2) }}</span>
    </div>
    <h3>{{ props.item.name }}</h3>
    <p v-if="props.item.description" class="card-copy">{{ props.item.description }}</p>
    <dl v-if="props.item.size || props.item.calories !== null" class="info-grid">
      <div v-if="props.item.size">
        <dt>Size</dt>
        <dd>{{ props.item.size }}</dd>
      </div>
      <div v-if="props.item.calories !== null">
        <dt>Calories</dt>
        <dd>{{ props.item.calories }}</dd>
      </div>
    </dl>
    <RouterLink
      v-if="props.item.id"
      class="card-link"
      :to="{ name: 'menu-item-detail', params: { itemId: props.item.id } }"
    >
      View details
    </RouterLink>
    <span v-else class="card-link card-link--disabled">Details unavailable</span>
  </BaseCard>
</template>
