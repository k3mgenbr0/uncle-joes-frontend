<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import OrderHistory from '../components/OrderHistory.vue'
import DashboardPoints from '../components/DashboardPoints.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import EmptyState from '../components/EmptyState.vue'
import { fetchSessionMemberOrders, fetchSessionMemberPoints } from '../services/membersService'
import { fetchMenu } from '../services/menuService'
import { fetchLocations } from '../services/locationsService'
import { createPickupOrder } from '../services/ordersService'
import { formatCurrency, formatDateTime, formatFeatureError, formatPhone, formatStoreLabel } from '../utils/formatters'

const orders = ref([])
const points = ref(0)
const menuItems = ref([])
const locations = ref([])
const ordersLoading = ref(true)
const pointsLoading = ref(true)
const builderLoading = ref(true)
const ordersError = ref('')
const pointsError = ref('')
const builderError = ref('')
const submitError = ref('')
const submitSuccess = ref(null)
const isSubmitting = ref(false)
const selectedStoreId = ref('')
const menuSearchTerm = ref('')
const selectedCategory = ref('All')
const cart = ref([])

const pointsHistory = computed(() =>
  orders.value.map((order) => ({
    id: order.id,
    date: order.date,
    points: order.pointsEarned || Math.floor(order.total || 0),
    total: order.total,
  })),
)

const categories = computed(() => [
  'All',
  ...Array.from(new Set(menuItems.value.map((item) => item.category).filter(Boolean))).sort(),
])

const filteredMenuItems = computed(() =>
  menuItems.value.filter((item) => {
    const matchesCategory = selectedCategory.value === 'All' || item.category === selectedCategory.value
    const matchesSearch = !menuSearchTerm.value.trim() || item.name.toLowerCase().includes(menuSearchTerm.value.trim().toLowerCase())
    return matchesCategory && matchesSearch
  }),
)

const selectedLocation = computed(() =>
  locations.value.find((location) => location.id === selectedStoreId.value) ?? null,
)

const cartItemCount = computed(() =>
  cart.value.reduce((total, item) => total + item.quantity, 0),
)

const cartSubtotal = computed(() =>
  cart.value.reduce((total, item) => total + item.price * item.quantity, 0),
)

const estimatedTax = computed(() => Number((cartSubtotal.value * 0.07).toFixed(2)))
const estimatedTotal = computed(() => Number((cartSubtotal.value + estimatedTax.value).toFixed(2)))

function itemKey(item) {
  return `${item.id}-${item.size || 'default'}`
}

function addToCart(item) {
  submitSuccess.value = null
  const key = itemKey(item)
  const existing = cart.value.find((entry) => entry.key === key)

  if (existing) {
    existing.quantity += 1
    return
  }

  cart.value.push({
    key,
    id: item.id,
    name: item.name,
    size: item.size,
    category: item.category,
    price: item.price,
    quantity: 1,
  })
}

function updateQuantity(key, nextQuantity) {
  const entry = cart.value.find((item) => item.key === key)

  if (!entry) {
    return
  }

  if (nextQuantity <= 0) {
    cart.value = cart.value.filter((item) => item.key !== key)
    return
  }

  entry.quantity = nextQuantity
}

function removeFromCart(key) {
  cart.value = cart.value.filter((item) => item.key !== key)
}

async function loadOrders() {
  ordersLoading.value = true
  ordersError.value = ''

  try {
    orders.value = await fetchSessionMemberOrders({ includeItems: true, limit: 50 })
  } catch (error) {
    ordersError.value = formatFeatureError(error.message, 'Orders')
  } finally {
    ordersLoading.value = false
  }
}

async function loadPoints() {
  pointsLoading.value = true
  pointsError.value = ''

  try {
    const result = await fetchSessionMemberPoints()
    points.value = result.value
  } catch (error) {
    pointsError.value = formatFeatureError(error.message, 'Rewards')
  } finally {
    pointsLoading.value = false
  }
}

async function loadBuilderData() {
  builderLoading.value = true
  builderError.value = ''

  try {
    const [menuResult, locationResult] = await Promise.all([
      fetchMenu(),
      fetchLocations(),
    ])
    menuItems.value = menuResult
    locations.value = locationResult
    if (!selectedStoreId.value && locationResult.length) {
      selectedStoreId.value = locationResult[0].id
    }
  } catch (error) {
    builderError.value = error.message
  } finally {
    builderLoading.value = false
  }
}

async function submitOrder() {
  submitError.value = ''
  submitSuccess.value = null

  if (!selectedStoreId.value) {
    submitError.value = 'Choose a pickup store before placing your order.'
    return
  }

  if (!cart.value.length) {
    submitError.value = 'Add at least one menu item to your order.'
    return
  }

  isSubmitting.value = true

  try {
    const createdOrder = await createPickupOrder({
      store_id: selectedStoreId.value,
      items: cart.value.map((item) => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        size: item.size || null,
      })),
      payment_method: 'pay_in_store',
    })

    submitSuccess.value = createdOrder
    cart.value = []
    await Promise.all([loadOrders(), loadPoints()])
  } catch (error) {
    submitError.value = error.message
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadOrders()
  loadPoints()
  loadBuilderData()
})
</script>

<template>
  <section class="section">
    <div class="container dashboard-stack">
      <div class="section-heading section-heading--left section-heading--wide">
        <span class="eyebrow">Pickup Ordering</span>
        <h1>Place a pickup order</h1>
        <p>Choose a store, build your drink order, and pay when you pick it up in store.</p>
      </div>

      <div class="dashboard-hero-grid">
        <DashboardPoints
          :points="points"
          :is-loading="pointsLoading"
          :error-message="pointsError"
          @retry="loadPoints"
        />

        <BaseCard padding="lg">
          <p class="eyebrow">Points History</p>
          <h2>Earned by order</h2>
          <div v-if="ordersLoading" class="detail-lead">Loading points history...</div>
          <div v-else-if="ordersError" class="helper-text helper-text--error">{{ ordersError }}</div>
          <div v-else-if="pointsHistory.length" class="favorites-list">
            <div v-for="entry in pointsHistory" :key="entry.id" class="favorite-link">
              <strong>{{ formatDateTime(entry.date) }}</strong>
              <span>{{ entry.points }} points • {{ formatCurrency(entry.total) }}</span>
            </div>
          </div>
          <EmptyState
            v-else
            compact
            title="No points history yet"
            description="Once you start ordering, earned points will show up here."
          />
        </BaseCard>
      </div>

      <div class="order-builder-layout">
        <BaseCard padding="lg">
          <div class="section-heading section-heading--left section-heading--compact">
            <span class="eyebrow">Step 1</span>
            <h2>Choose your pickup store</h2>
          </div>

          <LoadingState
            v-if="builderLoading"
            compact
            title="Loading stores"
            description="Getting Uncle Joe's pickup locations ready."
          />
          <ErrorState
            v-else-if="builderError"
            compact
            title="Order form unavailable"
            :message="builderError"
            action-label="Try Again"
            @action="loadBuilderData"
          />
          <div v-else class="order-builder-store">
            <label class="input-group">
              <span class="input-label">Pickup store</span>
              <select v-model="selectedStoreId" class="base-input base-select">
                <option disabled value="">Choose a store</option>
                <option
                  v-for="location in locations"
                  :key="location.id"
                  :value="location.id"
                >
                  {{ formatStoreLabel(location.storeName, location.city, location.state) }}
                </option>
              </select>
            </label>

            <div v-if="selectedLocation" class="order-store-summary">
              <strong>{{ formatStoreLabel(selectedLocation.storeName, selectedLocation.city, selectedLocation.state) }}</strong>
              <span v-if="selectedLocation.address">{{ selectedLocation.address }}</span>
              <span v-if="selectedLocation.phone">Phone: {{ formatPhone(selectedLocation.phone) }}</span>
              <span v-if="selectedLocation.hoursTodayLabel">Today: {{ selectedLocation.hoursTodayLabel }}</span>
            </div>
          </div>
        </BaseCard>

        <BaseCard padding="lg">
          <div class="section-heading section-heading--left section-heading--compact">
            <span class="eyebrow">Step 2</span>
            <h2>Build your order</h2>
          </div>

          <div class="filters-grid filters-grid--two">
            <label class="input-group">
              <span class="input-label">Search menu</span>
              <input
                v-model="menuSearchTerm"
                class="base-input"
                type="text"
                placeholder="Search by item name"
              />
            </label>

            <label class="input-group">
              <span class="input-label">Category</span>
              <select v-model="selectedCategory" class="base-input base-select">
                <option v-for="category in categories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </label>
          </div>

          <div v-if="!builderLoading && !builderError && filteredMenuItems.length" class="order-menu-grid">
            <article
              v-for="item in filteredMenuItems"
              :key="itemKey(item)"
              class="order-menu-item"
            >
              <div class="card-topline">
                <span v-if="item.category" class="badge">{{ item.category }}</span>
                <span class="price-tag">{{ item.priceDisplay || formatCurrency(item.price) }}</span>
              </div>
              <h3>{{ item.name }}</h3>
              <p class="card-copy">{{ [item.size, item.calories !== null ? `${item.calories} cal` : ''].filter(Boolean).join(' • ') }}</p>
              <BaseButton size="sm" @click="addToCart(item)">Add to Order</BaseButton>
            </article>
          </div>

          <EmptyState
            v-else-if="!builderLoading && !builderError"
            compact
            title="No menu matches your filters"
            description="Try another search term or category."
          />
        </BaseCard>
      </div>

      <BaseCard padding="lg">
        <div class="section-heading section-heading--left section-heading--compact">
          <span class="eyebrow">Step 3</span>
          <h2>Review and place your order</h2>
        </div>

        <div v-if="cart.length" class="orders-stack">
          <div
            v-for="item in cart"
            :key="item.key"
            class="cart-line"
          >
            <div>
              <strong>{{ item.name }}</strong>
              <p class="card-copy">{{ [item.size, item.category].filter(Boolean).join(' • ') }}</p>
            </div>

            <div class="cart-line__controls">
              <button class="quantity-button" type="button" @click="updateQuantity(item.key, item.quantity - 1)">−</button>
              <span>{{ item.quantity }}</span>
              <button class="quantity-button" type="button" @click="updateQuantity(item.key, item.quantity + 1)">+</button>
            </div>

            <strong>{{ formatCurrency(item.price * item.quantity) }}</strong>
            <button class="card-link" type="button" @click="removeFromCart(item.key)">Remove</button>
          </div>

          <div class="order-summary">
            <div class="hours-row">
              <span>Items</span>
              <strong>{{ cartItemCount }}</strong>
            </div>
            <div class="hours-row">
              <span>Subtotal</span>
              <strong>{{ formatCurrency(cartSubtotal) }}</strong>
            </div>
            <div class="hours-row">
              <span>Estimated tax</span>
              <strong>{{ formatCurrency(estimatedTax) }}</strong>
            </div>
            <div class="hours-row">
              <span>Estimated total</span>
              <strong>{{ formatCurrency(estimatedTotal) }}</strong>
            </div>
            <p class="helper-text">Your final total and points will be confirmed by the backend at order time. Payment happens in store.</p>
          </div>
        </div>

        <EmptyState
          v-else
          compact
          title="Your order is empty"
          description="Add drinks or cafe favorites above to start a pickup order."
        />

        <p v-if="submitError" class="helper-text helper-text--error">{{ submitError }}</p>

        <div class="hero-actions">
          <BaseButton :disabled="isSubmitting || !cart.length || !selectedStoreId" @click="submitOrder">
            {{ isSubmitting ? 'Placing Order...' : 'Place Pickup Order' }}
          </BaseButton>
        </div>

        <BaseCard v-if="submitSuccess" class="order-confirmation-card" padding="lg">
          <p class="eyebrow">Order Confirmed</p>
          <h2>Ready for pickup</h2>
          <p class="detail-lead">
            {{ formatStoreLabel(submitSuccess.locationName || submitSuccess.store_name, submitSuccess.city || submitSuccess.store_city, submitSuccess.state || submitSuccess.store_state) }}
          </p>
          <div class="detail-grid">
            <div class="detail-grid__item">
              <span class="detail-label">Order Number</span>
              <strong class="detail-value">{{ submitSuccess.id || submitSuccess.order_id }}</strong>
            </div>
            <div class="detail-grid__item">
              <span class="detail-label">Ready To Pay In Store</span>
              <strong class="detail-value">{{ formatCurrency(submitSuccess.total || submitSuccess.paymentSummary?.total || estimatedTotal) }}</strong>
            </div>
          </div>
        </BaseCard>
      </BaseCard>

      <OrderHistory
        :orders="orders"
        :is-loading="ordersLoading"
        :error-message="ordersError"
        eyebrow="Previous Orders"
        title="Your previous pickup orders"
        @retry="loadOrders"
      />
    </div>
  </section>
</template>
