<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import MenuCard from '../components/MenuCard.vue'
import MenuFilters from '../components/MenuFilters.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import EmptyState from '../components/EmptyState.vue'
import { fetchMenu, groupMenuItems } from '../services/menuService'
import { createFavorite, deleteFavorite, fetchSessionMemberFavorites } from '../services/membersService'

const authStore = useAuthStore()
const menuItems = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const searchTerm = ref('')
const selectedCategory = ref('All')
const explicitFavoriteIds = ref(new Set())
const pendingFavoriteIds = ref(new Set())
const favoriteError = ref('')

const groupedMenuItems = computed(() => groupMenuItems(menuItems.value))

const categories = computed(() => {
  const values = new Set(groupedMenuItems.value.map((item) => item.category).filter(Boolean))
  return ['All', ...Array.from(values).sort()]
})

const filteredItems = computed(() => {
  return groupedMenuItems.value.filter((item) => {
    const matchesCategory = selectedCategory.value === 'All' || item.category === selectedCategory.value
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.value.trim().toLowerCase())
    return matchesCategory && matchesSearch
  })
})

function isFavorite(item) {
  return item.variants.some((variant) => explicitFavoriteIds.value.has(variant.id))
}

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

async function loadFavorites() {
  if (!authStore.isAuthenticated) {
    explicitFavoriteIds.value = new Set()
    return
  }

  try {
    const favorites = await fetchSessionMemberFavorites({ limit: 50 })
    explicitFavoriteIds.value = new Set(
      favorites
        .filter((favorite) => favorite.isExplicit)
        .map((favorite) => favorite.menuItemId),
    )
  } catch (error) {
    favoriteError.value = error.message
  }
}

async function toggleFavorite({ item, variant }) {
  favoriteError.value = ''
  const variantId = variant.id
  const wasFavorite = explicitFavoriteIds.value.has(variantId)
  const nextFavorites = new Set(explicitFavoriteIds.value)
  const nextPending = new Set(pendingFavoriteIds.value)

  if (wasFavorite) {
    nextFavorites.delete(variantId)
  } else {
    nextFavorites.add(variantId)
  }

  nextPending.add(variantId)
  explicitFavoriteIds.value = nextFavorites
  pendingFavoriteIds.value = nextPending

  try {
    if (wasFavorite) {
      await deleteFavorite(variantId)
      return
    }

    await createFavorite(variantId)
  } catch (error) {
    const rollbackFavorites = new Set(explicitFavoriteIds.value)

    if (wasFavorite) {
      rollbackFavorites.add(variantId)
    } else {
      rollbackFavorites.delete(variantId)
    }

    explicitFavoriteIds.value = rollbackFavorites
    favoriteError.value = error.message
  } finally {
    const clearedPending = new Set(pendingFavoriteIds.value)
    clearedPending.delete(variantId)
    pendingFavoriteIds.value = clearedPending
  }
}

onMounted(() => {
  Promise.all([loadMenu(), loadFavorites()])
})
</script>

<template>
  <section class="section section--catalog">
    <div class="container">
      <div class="section-heading section-heading--wide catalog-heading">
        <div>
          <span class="eyebrow">Freshly Brewed</span>
          <h1>Menu</h1>
          <p>Browse drinks and cafe favorites with quick filters to find your next order.</p>
        </div>
        <p class="catalog-heading__note">Save your usuals from the menu, then reorder them faster when you're ready to pick up.</p>
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
          :key="item.id || item.name"
          :item="item"
          :is-favorite="isFavorite(item)"
          :is-favorite-pending="item.variants.some((variant) => pendingFavoriteIds.has(variant.id))"
          :favorite-enabled="authStore.isAuthenticated"
          @favorite-toggle="toggleFavorite"
        />
      </div>

      <p v-if="favoriteError" class="helper-text helper-text--error">{{ favoriteError }}</p>
    </div>
  </section>
</template>
