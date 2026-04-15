<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import MenuCard from '../components/MenuCard.vue'
import MenuFilters from '../components/MenuFilters.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import EmptyState from '../components/EmptyState.vue'
import BaseButton from '../components/BaseButton.vue'
import { fetchMenu, fetchMenuItem } from '../services/menuService'

const menuItems = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const searchTerm = ref('')
const selectedCategory = ref('All')
const activeItem = ref(null)
const isItemLoading = ref(false)
const itemError = ref('')

const categories = computed(() => {
  const values = new Set(menuItems.value.map((item) => item.category).filter(Boolean))
  return ['All', ...Array.from(values).sort()]
})

const filteredItems = computed(() => {
  return menuItems.value.filter((item) => {
    const matchesCategory = selectedCategory.value === 'All' || item.category === selectedCategory.value
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.value.trim().toLowerCase())
    return matchesCategory && matchesSearch
  })
})

async function loadMenu() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    menuItems.value = await fetchMenu()
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}

async function handleSelectItem(item) {
  if (!item.id) {
    activeItem.value = item
    return
  }

  isItemLoading.value = true
  itemError.value = ''

  try {
    activeItem.value = await fetchMenuItem(item.id)
  } catch (error) {
    itemError.value = error.message
    activeItem.value = item
  } finally {
    isItemLoading.value = false
  }
}

function closeDetails() {
  activeItem.value = null
  itemError.value = ''
}

onMounted(loadMenu)
</script>

<template>
  <section class="section">
    <div class="container">
      <div class="section-heading">
        <span class="eyebrow">Freshly Brewed</span>
        <h1>Menu</h1>
        <p>Browse drinks and cafe favorites with quick filters to find your next order.</p>
      </div>

      <MenuFilters
        v-model:search-term="searchTerm"
        v-model:selected-category="selectedCategory"
        :categories="categories"
      />

      <LoadingState
        v-if="isLoading"
        title="Loading the menu"
        description="Pulling the latest offerings from Uncle Joe's Coffee."
      />

      <ErrorState
        v-else-if="errorMessage"
        title="Menu unavailable"
        :message="errorMessage"
        action-label="Try Again"
        @action="loadMenu"
      />

      <EmptyState
        v-else-if="!filteredItems.length"
        title="No menu items found"
        description="Try a different search term or category to broaden the results."
      />

      <div v-else class="cards-grid cards-grid--three">
        <MenuCard
          v-for="item in filteredItems"
          :key="item.id || `${item.name}-${item.size}`"
          :item="item"
          @select="handleSelectItem"
        />
      </div>
    </div>

    <div
      v-if="activeItem"
      class="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-item-title"
      @click.self="closeDetails"
    >
      <BaseCard class="modal-card" padding="lg">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Menu Details</p>
            <h2 id="menu-item-title">{{ activeItem.name }}</h2>
          </div>
          <BaseButton variant="ghost" @click="closeDetails">Close</BaseButton>
        </div>

        <LoadingState
          v-if="isItemLoading"
          compact
          title="Loading item details"
          description="Fetching the latest details for this menu item."
        />

        <div v-else class="detail-stack">
          <p v-if="itemError" class="helper-text helper-text--error">{{ itemError }}</p>
          <p>{{ activeItem.description || 'No additional description is available for this item yet.' }}</p>
          <div class="detail-grid">
            <div>
              <span class="detail-label">Category</span>
              <strong>{{ activeItem.category }}</strong>
            </div>
            <div>
              <span class="detail-label">Size</span>
              <strong>{{ activeItem.size }}</strong>
            </div>
            <div>
              <span class="detail-label">Calories</span>
              <strong>{{ activeItem.calories ?? 'N/A' }}</strong>
            </div>
            <div>
              <span class="detail-label">Price</span>
              <strong>${{ activeItem.price.toFixed(2) }}</strong>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </section>
</template>
