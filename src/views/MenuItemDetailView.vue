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
          <div v-if="item.image" class="detail-image-wrap">
            <img :src="item.image" :alt="item.name" class="detail-image" />
          </div>
          <div class="card-topline">
            <span class="badge">{{ item.category || 'Menu Item' }}</span>
            <span class="price-tag">${{ item.price.toFixed(2) }}</span>
          </div>
          <h1>{{ item.name }}</h1>
          <p class="detail-lead">
            {{ item.description || 'This item is available now at Uncle Joe\'s Coffee Company.' }}
          </p>

          <div class="service-badges">
            <span v-if="item.availabilityStatus" class="badge">{{ item.availabilityStatus }}</span>
            <span v-if="item.seasonal" class="badge">Seasonal</span>
            <span v-for="tag in item.tags" :key="tag" class="badge">{{ tag }}</span>
          </div>

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
            <div>
              <span class="detail-label">Caffeine</span>
              <strong>{{ item.caffeineMg ? `${item.caffeineMg} mg` : 'N/A' }}</strong>
            </div>
            <div>
              <span class="detail-label">Availability</span>
              <strong>{{ item.availabilityStatus || 'Available' }}</strong>
            </div>
          </div>
        </BaseCard>

        <div class="detail-sidebar">
          <BaseCard padding="lg">
            <p class="eyebrow">Ingredients</p>
            <h2>What’s in the cup</h2>
            <ul v-if="item.ingredients.length" class="detail-list">
              <li v-for="ingredient in item.ingredients" :key="ingredient">{{ ingredient }}</li>
            </ul>
            <p v-else class="detail-lead">Ingredient details are not available for this item yet.</p>
          </BaseCard>

          <BaseCard padding="lg">
            <p class="eyebrow">Allergens & Customization</p>
            <h2>Order with confidence</h2>
            <div class="detail-stack">
              <div>
                <span class="detail-label">Allergens</span>
                <p class="detail-lead">
                  {{ item.allergens.length ? item.allergens.join(', ') : 'No allergen information listed.' }}
                </p>
              </div>
              <div>
                <span class="detail-label">Customization Options</span>
                <p class="detail-lead">
                  {{ item.customizationOptions.length ? item.customizationOptions.join(', ') : 'No customizations listed.' }}
                </p>
              </div>
            </div>
          </BaseCard>

          <BaseCard padding="lg">
            <p class="eyebrow">Related Picks</p>
            <h2>More to explore</h2>
            <div v-if="item.relatedItems.length" class="related-links">
              <RouterLink
                v-for="related in item.relatedItems"
                :key="related.id"
                :to="{ name: 'menu-item-detail', params: { itemId: related.id } }"
                class="related-link"
              >
                <strong>{{ related.name }}</strong>
                <span>{{ related.category || 'Menu Item' }}<template v-if="related.price !== null"> • ${{ Number(related.price).toFixed(2) }}</template></span>
              </RouterLink>
            </div>
            <p v-else class="detail-lead">No related items are available yet.</p>
            <RouterLink :to="{ name: 'menu' }">
              <BaseButton variant="secondary">Browse More Drinks</BaseButton>
            </RouterLink>
          </BaseCard>
        </div>
      </div>
    </div>
  </section>
</template>
