<script setup>
import { computed, ref, watch } from 'vue'
import BaseCard from './BaseCard.vue'
import { formatCurrency } from '../utils/formatters'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  favoriteEnabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['favorite-toggle'])

const selectedVariantId = ref(props.item.defaultVariant?.id ?? props.item.variants?.[0]?.id ?? '')

watch(
  () => props.item.id,
  () => {
    selectedVariantId.value = props.item.defaultVariant?.id ?? props.item.variants?.[0]?.id ?? ''
  },
)

const selectedVariant = computed(() =>
  props.item.variants.find((variant) => variant.id === selectedVariantId.value)
    ?? props.item.defaultVariant
    ?? props.item.variants[0]
    ?? null,
)

function toggleFavorite() {
  if (!selectedVariant.value?.id) {
    return
  }

  emit('favorite-toggle', {
    item: props.item,
    variant: selectedVariant.value,
  })
}
</script>

<template>
  <BaseCard class="menu-card">
    <div class="card-topline">
      <span v-if="props.item.category" class="badge">{{ props.item.category }}</span>
      <span class="price-tag">
        {{ selectedVariant?.priceDisplay || formatCurrency(selectedVariant?.price) }}
      </span>
    </div>
    <div v-if="favoriteEnabled" class="card-topline">
      <span class="helper-text helper-text--compact">
        {{ selectedVariant?.size ? `${selectedVariant.size} size selected` : 'Save your usual for faster reordering' }}
      </span>
      <button
        class="favorite-toggle"
        type="button"
        :aria-pressed="props.isFavorite"
        @click="toggleFavorite"
      >
        {{ props.isFavorite ? '★ Saved' : '☆ Save' }}
      </button>
    </div>
    <h3>{{ props.item.name }}</h3>
    <p v-if="props.item.description" class="card-copy">{{ props.item.description }}</p>

    <div v-if="props.item.variants.length > 1" class="size-toggle-group">
      <button
        v-for="variant in props.item.variants"
        :key="variant.id"
        type="button"
        :class="['size-toggle', { 'size-toggle--active': selectedVariant?.id === variant.id }]"
        @click="selectedVariantId = variant.id"
      >
        {{ variant.size }}
      </button>
    </div>

    <dl v-if="selectedVariant?.size || selectedVariant?.calories !== null" class="info-grid">
      <div v-if="selectedVariant?.size">
        <dt>Size</dt>
        <dd>{{ selectedVariant.size }}</dd>
      </div>
      <div v-if="selectedVariant?.calories !== null">
        <dt>Calories</dt>
        <dd>{{ selectedVariant.calories }}</dd>
      </div>
    </dl>
    <RouterLink
      v-if="selectedVariant?.id"
      class="card-link"
      :to="{ name: 'menu-item-detail', params: { itemId: selectedVariant.id } }"
    >
      View details
    </RouterLink>
    <span v-else class="card-link card-link--disabled">Details unavailable</span>
  </BaseCard>
</template>
