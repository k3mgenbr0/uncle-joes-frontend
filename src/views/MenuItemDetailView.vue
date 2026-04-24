<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import { fetchMenu, fetchMenuItem, groupMenuItems } from '../services/menuService'
import { dedupeLabels, formatCurrency, formatServiceLabel } from '../utils/formatters'

const route = useRoute()
const router = useRouter()
const item = ref(null)
const catalogVariants = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

const itemId = computed(() => route.params.itemId)
const SIZE_PRIORITY = {
  Small: 1,
  Medium: 2,
  Large: 3,
}

const variantOptions = computed(() => {
  if (catalogVariants.value.length) {
    return catalogVariants.value
      .map((variant) => ({
        id: variant.id,
        name: item.value?.name ?? '',
        category: variant.raw?.category ?? item.value?.category ?? '',
        size: variant.size,
        price: variant.price,
        priceDisplay: variant.priceDisplay,
        calories: variant.calories,
        current: variant.id === item.value?.id,
      }))
      .sort((left, right) => {
        const leftPriority = SIZE_PRIORITY[left.size] ?? 99
        const rightPriority = SIZE_PRIORITY[right.size] ?? 99

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority
        }

        return (left.size || '').localeCompare(right.size || '')
      })
  }

  if (!item.value) {
    return []
  }

  const variants = [
    {
      id: item.value.id,
      name: item.value.name,
      category: item.value.category,
      size: item.value.size,
      price: item.value.price,
      priceDisplay: item.value.priceDisplay,
      calories: item.value.calories,
      current: true,
    },
    ...item.value.relatedItems
      .filter((related) => related.name === item.value.name)
      .map((related) => ({
        id: related.id,
        name: related.name,
        category: related.category || item.value.category,
        size: related.size,
        price: related.price ?? 0,
        priceDisplay: related.price !== null && related.price !== undefined ? formatCurrency(related.price) : '',
        calories: related.calories ?? null,
        current: false,
      })),
  ]

  const seen = new Set()

  return variants
    .filter((variant) => {
      const key = `${variant.size || 'default'}::${variant.id}`

      if (!variant.id || seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
    .sort((left, right) => {
      const leftPriority = SIZE_PRIORITY[left.size] ?? 99
      const rightPriority = SIZE_PRIORITY[right.size] ?? 99

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority
      }

      return (left.size || '').localeCompare(right.size || '')
    })
})

const alternateSizes = computed(() =>
  variantOptions.value.filter((variant) => variant.id !== item.value?.id),
)

const detailRows = computed(() =>
  [
    item.value?.size ? { label: 'Size', value: item.value.size } : null,
    item.value?.calories !== null && item.value?.calories !== undefined
      ? { label: 'Calories', value: `${item.value.calories} calories` }
      : null,
    item.value?.caffeineMg ? { label: 'Caffeine', value: `${item.value.caffeineMg} mg` } : null,
    item.value?.price || item.value?.priceDisplay
      ? { label: 'Price', value: item.value.priceDisplay || formatCurrency(item.value.price) }
      : null,
  ].filter(Boolean),
)

const displayTags = computed(() => {
  if (!item.value) {
    return []
  }

  const excluded = new Set(
    [item.value.category, item.value.size, item.value.availabilityStatus]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase()),
  )

  return dedupeLabels(item.value.tags, formatServiceLabel).filter(
    (tag) => !excluded.has(tag.toLowerCase()),
  )
})

const relatedItems = computed(() => {
  if (!item.value?.relatedItems?.length) {
    return []
  }

  const seen = new Set()

  return item.value.relatedItems.filter((related) => {
    if (related.name === item.value.name) {
      return false
    }

    const key = [
      related.id,
      related.name,
      related.size,
      related.price,
    ]
      .filter((value) => value !== null && value !== undefined && value !== '')
      .join('::')
      .toLowerCase()

    if (!key || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
})

function formatDetailValue(value) {
  return typeof value === 'string' ? value : String(value)
}

function formatRelatedMeta(related) {
  return [related.category, related.size, related.price !== null ? formatCurrency(related.price) : '']
    .filter(Boolean)
    .join(' • ')
}

function selectVariant(variantId) {
  if (!variantId || variantId === item.value?.id) {
    return
  }

  router.push({ name: 'menu-item-detail', params: { itemId: variantId } })
}

async function loadItem() {
  isLoading.value = true
  errorMessage.value = ''
  catalogVariants.value = []

  try {
    const [detailItem, menuItems] = await Promise.all([
      fetchMenuItem(itemId.value),
      fetchMenu(),
    ])

    const groupedItems = groupMenuItems(menuItems)
    const matchingGroup =
      groupedItems.find((group) => group.variants.some((variant) => variant.id === String(itemId.value)))
      ?? groupedItems.find((group) =>
        group.name === detailItem.name && group.category === detailItem.category,
      )
      ?? null

    catalogVariants.value = matchingGroup?.variants ?? []

    const matchingVariant =
      matchingGroup?.variants.find((variant) => variant.id === String(itemId.value))
      ?? null

    item.value = {
      ...detailItem,
      size: detailItem.size || matchingVariant?.size || '',
      calories:
        detailItem.calories !== null && detailItem.calories !== undefined
          ? detailItem.calories
          : matchingVariant?.calories ?? null,
      price:
        detailItem.price || detailItem.price === 0
          ? detailItem.price
          : matchingVariant?.price ?? 0,
      priceDisplay: detailItem.priceDisplay || matchingVariant?.priceDisplay || '',
    }
  } catch (error) {
    errorMessage.value = error.message
    item.value = null
    catalogVariants.value = []
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

          <div v-if="variantOptions.length > 1" class="detail-stack">
            <span class="detail-label">Choose a size</span>
            <div class="size-toggle-group">
              <button
                v-for="variant in variantOptions"
                :key="variant.id"
                type="button"
                :class="['size-toggle', { 'size-toggle--active': variant.id === item.id }]"
                @click="selectVariant(variant.id)"
              >
                {{ variant.size }}
              </button>
            </div>
            <p class="helper-text helper-text--compact">
              {{
                item.size
                  ? `${item.size} size selected`
                  : 'This item is available in multiple sizes.'
              }}
            </p>
          </div>

          <div v-if="item.availabilityStatus || item.seasonal || displayTags.length" class="service-badges">
            <span v-if="item.availabilityStatus" class="badge">{{ formatServiceLabel(item.availabilityStatus) }}</span>
            <span v-if="item.seasonal" class="badge">Seasonal</span>
            <span v-for="tag in displayTags" :key="tag" class="badge">{{ tag }}</span>
          </div>

          <div v-if="detailRows.length" class="detail-grid">
            <div v-for="row in detailRows" :key="row.label" class="detail-grid__item">
              <span class="detail-label">{{ row.label }}</span>
              <strong class="detail-value">{{ formatDetailValue(row.value) }}</strong>
            </div>
          </div>
        </BaseCard>

        <div v-if="alternateSizes.length || item.ingredients.length || item.allergens.length || item.customizationOptions.length || relatedItems.length" class="detail-sidebar">
          <BaseCard v-if="alternateSizes.length" padding="lg">
            <p class="eyebrow">Other Sizes</p>
            <h2>Pick the right fit</h2>
            <div class="related-links">
              <button
                v-for="variant in alternateSizes"
                :key="variant.id"
                type="button"
                class="related-link related-link--button"
                @click="selectVariant(variant.id)"
              >
                <strong>{{ variant.size || 'Another size' }}</strong>
                <span>{{ variant.priceDisplay || formatCurrency(variant.price) }}</span>
              </button>
            </div>
          </BaseCard>

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

          <BaseCard v-if="relatedItems.length" padding="lg">
            <p class="eyebrow">Related Picks</p>
            <h2>More to explore</h2>
            <div class="related-links">
              <RouterLink
                v-for="related in relatedItems"
                :key="related.id"
                :to="{ name: 'menu-item-detail', params: { itemId: related.id } }"
                class="related-link"
              >
                <strong>{{ related.name }}</strong>
                <span>{{ formatRelatedMeta(related) }}</span>
              </RouterLink>
            </div>
          </BaseCard>
        </div>
      </div>
    </div>
  </section>
</template>
