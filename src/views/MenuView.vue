<script setup>
import { computed, onMounted, ref } from 'vue'
import MenuCard from '../components/MenuCard.vue'
import MenuFilters from '../components/MenuFilters.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import EmptyState from '../components/EmptyState.vue'
import { fetchMenu } from '../services/menuService'

const menuItems = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const searchTerm = ref('')
const selectedCategory = ref('All')

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
        />
      </div>
    </div>
  </section>
</template>
