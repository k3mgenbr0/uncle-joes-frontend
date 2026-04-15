<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import { fetchMenuItem } from '../services/menuService'

const route = useRoute()
const item = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')

const itemId = computed(() => route.params.itemId)

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
          <div class="card-topline">
            <span class="badge">{{ item.category || 'Menu Item' }}</span>
            <span class="price-tag">${{ item.price.toFixed(2) }}</span>
          </div>
          <h1>{{ item.name }}</h1>
          <p class="detail-lead">
            {{ item.description || 'This item is available now at Uncle Joe\'s Coffee Company.' }}
          </p>

          <div class="detail-grid">
            <div>
              <span class="detail-label">Size</span>
              <strong>{{ item.size || 'Standard' }}</strong>
            </div>
            <div>
              <span class="detail-label">Calories</span>
              <strong>{{ item.calories ?? 'N/A' }}</strong>
            </div>
            <div>
              <span class="detail-label">Category</span>
              <strong>{{ item.category || 'Uncategorized' }}</strong>
            </div>
            <div>
              <span class="detail-label">Item ID</span>
              <strong>{{ item.id }}</strong>
            </div>
          </div>
        </BaseCard>

        <BaseCard padding="lg">
          <p class="eyebrow">Order Inspiration</p>
          <h2>Freshly brewed and ready to pair</h2>
          <p class="detail-lead">
            This routed detail page is ready for richer backend fields like ingredients, allergens, and images as soon as they are available.
          </p>
          <RouterLink :to="{ name: 'menu' }">
            <BaseButton variant="secondary">Browse More Drinks</BaseButton>
          </RouterLink>
        </BaseCard>
      </div>
    </div>
  </section>
</template>
