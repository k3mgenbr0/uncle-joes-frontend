<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import { fetchMenuItem } from '../services/menuService'
import { formatCurrency } from '../utils/formatters'

const route = useRoute()
const item = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')

const itemId = computed(() => route.params.itemId)
const detailRows = computed(() =>
  [
    item.value?.size ? { label: 'Size', value: item.value.size } : null,
    item.value?.calories !== null && item.value?.calories !== undefined
      ? { label: 'Calories', value: item.value.calories }
      : null,
    item.value?.category ? { label: 'Category', value: item.value.category } : null,
    item.value?.caffeineMg ? { label: 'Caffeine', value: `${item.value.caffeineMg} mg` } : null,
    item.value?.availabilityStatus ? { label: 'Availability', value: item.value.availabilityStatus } : null,
  ].filter(Boolean),
)

function formatDetailValue(value) {
  return typeof value === 'string' ? value : String(value)
}

async function loadItem() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    item.value = await fetchMenuItem(itemId.value)
  } catch (error) {
    errorMessage.value = error.message
    item.value = null
  } finally {
    isLoading.value = false
  }
}

watch(
  item,
  (currentItem) => {
    if (currentItem?.name) {
      document.title = `${currentItem.name} | Uncle Joe's Coffee Company`
    }
  },
  { immediate: false },
)

watch(itemId, loadItem)
onMounted(loadItem)
</script>

<template>
  <section class="section">
    <div class="container detail-page">
      <RouterLink class="back-link" :to="{ name: 'menu' }">← Back to menu</RouterLink>

      <LoadingState
        v-if="isLoading"
        title="Loading menu item"
        description="Fetching the latest item details from Uncle Joe's Coffee."
      />

      <ErrorState
        v-else-if="errorMessage"
        title="Menu item unavailable"
        :message="errorMessage"
        action-label="Try Again"
        @action="loadItem"
      />

      <div v-else-if="item" class="detail-layout">
        <BaseCard class="detail-hero-card" padding="lg">
          <div v-if="item.image" class="detail-image-wrap">
            <img :src="item.image" :alt="item.name" class="detail-image" />
          </div>
          <div class="card-topline">
            <span v-if="item.category" class="badge">{{ item.category }}</span>
            <span class="price-tag">{{ item.priceDisplay || formatCurrency(item.price) }}</span>
          </div>
          <h1>{{ item.name }}</h1>
          <p v-if="item.description" class="detail-lead">{{ item.description }}</p>

          <div v-if="item.availabilityStatus || item.seasonal || item.tags.length" class="service-badges">
            <span v-if="item.availabilityStatus" class="badge">{{ item.availabilityStatus }}</span>
            <span v-if="item.seasonal" class="badge">Seasonal</span>
            <span v-for="tag in item.tags" :key="tag" class="badge">{{ tag }}</span>
          </div>

          <div v-if="detailRows.length" class="detail-grid">
            <div v-for="row in detailRows" :key="row.label">
              <span class="detail-label">{{ row.label }}</span>
              <strong>{{ formatDetailValue(row.value) }}</strong>
            </div>
          </div>
        </BaseCard>

        <div v-if="item.ingredients.length || item.allergens.length || item.customizationOptions.length || item.relatedItems.length" class="detail-sidebar">
          <BaseCard v-if="item.ingredients.length" padding="lg">
            <p class="eyebrow">Ingredients</p>
            <h2>What’s in the cup</h2>
            <ul class="detail-list">
              <li v-for="ingredient in item.ingredients" :key="ingredient">{{ ingredient }}</li>
            </ul>
          </BaseCard>

          <BaseCard v-if="item.allergens.length || item.customizationOptions.length" padding="lg">
            <p class="eyebrow">Allergens & Customization</p>
            <h2>Order with confidence</h2>
            <div class="detail-stack">
              <div v-if="item.allergens.length">
                <span class="detail-label">Allergens</span>
                <p class="detail-lead">{{ item.allergens.join(', ') }}</p>
              </div>
              <div v-if="item.customizationOptions.length">
                <span class="detail-label">Customization Options</span>
                <p class="detail-lead">{{ item.customizationOptions.join(', ') }}</p>
              </div>
            </div>
          </BaseCard>

          <BaseCard v-if="item.relatedItems.length" padding="lg">
            <p class="eyebrow">Related Picks</p>
            <h2>More to explore</h2>
            <div class="related-links">
              <RouterLink
                v-for="related in item.relatedItems"
                :key="related.id"
                :to="{ name: 'menu-item-detail', params: { itemId: related.id } }"
                class="related-link"
              >
                <strong>{{ related.name }}</strong>
                <span>
                  <template v-if="related.category">{{ related.category }}</template>
                  <template v-if="related.category && related.price !== null"> • </template>
                  <template v-if="related.price !== null">{{ formatCurrency(related.price) }}</template>
                </span>
              </RouterLink>
            </div>
          </BaseCard>
        </div>
      </div>
    </div>
  </section>
</template>
