<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import OrderHistory from '../components/OrderHistory.vue'
import DashboardPoints from '../components/DashboardPoints.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import EmptyState from '../components/EmptyState.vue'
import { createFavorite, deleteFavorite, fetchMemberDashboard, fetchSessionMemberFavorites, fetchSessionMemberOrders, fetchSessionMemberPoints } from '../services/membersService'
import { fetchMenuForStore, groupMenuItems } from '../services/menuService'
import { fetchNearbyLocations, fetchOrderableLocations, findClosestLocation, formatStoreOptionLabel, isStoreOrderable, sortNearbyLocations } from '../services/locationsService'
import { createPickupOrder } from '../services/ordersService'
import { formatCurrency, formatDateTime, formatFeatureError, formatHoursRange, formatOrderStatus, formatPhone } from '../utils/formatters'

const router = useRouter()
const authStore = useAuthStore()
const activePanel = ref('builder')
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
const favoriteError = ref('')
const orderItemsLimited = ref(false)
const scheduleMismatch = ref(false)
const selectedStoreId = ref('')
const storeSearchTerm = ref('')
const menuSearchTerm = ref('')
const selectedCategory = ref('All')
const favoritesOnly = ref(false)
const availableOnly = ref(true)
const selectedVariantByGroup = ref({})
const pickupTime = ref('')
const specialInstructions = ref('')
const orderSearchTerm = ref('')
const selectedOrderStatus = ref('All')
const orderSort = ref('newest')
const visibleOrderCount = ref(6)
const cart = ref([])
const explicitFavoriteIds = ref(new Set())
const favoriteItems = ref([])
const dashboardPointsHistory = ref([])
const userCoordinates = ref(null)

const pointsHistory = computed(() =>
  (dashboardPointsHistory.value.length ? dashboardPointsHistory.value : orders.value.slice(0, 6).map((order) => ({
    id: order.id,
    date: order.date,
    points: order.pointsEarned || Math.floor(order.total || 0),
    total: order.total,
  })))
)

const categories = computed(() => [
  'All',
  ...Array.from(new Set(menuItems.value.map((item) => item.category).filter(Boolean))).sort(),
])

const groupedMenuItems = computed(() => groupMenuItems(menuItems.value))
const favoriteGroups = computed(() =>
  favoriteItems.value
    .filter((favorite) => favorite.isExplicit)
    .map((favorite) => {
    const matchingGroup = groupedMenuItems.value.find((group) =>
      group.variants.some((variant) => variant.id === favorite.menuItemId),
    )
    const matchingVariant =
      matchingGroup?.variants.find((variant) => variant.id === favorite.menuItemId)
      ?? null

    return {
      ...favorite,
      groupId: matchingGroup?.id ?? favorite.menuItemId,
      matchingVariant,
      displaySize: favorite.size || favorite.defaultSize || matchingVariant?.size || '',
      displayPrice:
        favorite.currentPrice
        || matchingVariant?.price
        || 0,
      displayPriceLabel:
        favorite.currentPrice
          ? formatCurrency(favorite.currentPrice)
          : matchingVariant?.priceDisplay || formatCurrency(matchingVariant?.price),
      availableAtStore:
        favorite.availableAtStore
        ?? matchingVariant?.availableAtStore
        ?? null,
    }
  }),
)
const filteredStoreOptions = computed(() => {
  const query = storeSearchTerm.value.trim().toLowerCase()

  if (!query) {
    return locations.value
  }

  return locations.value.filter((location) =>
    [
      formatStoreOptionLabel(location, locations.value),
      location.city,
      location.state,
      location.address,
      location.displayName,
      location.region,
      location.metroArea,
      location.nearBy,
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query)),
  )
})

const filteredMenuItems = computed(() =>
  groupedMenuItems.value.filter((item) => {
    const matchesCategory = selectedCategory.value === 'All' || item.category === selectedCategory.value
    const matchesSearch = !menuSearchTerm.value.trim() || item.name.toLowerCase().includes(menuSearchTerm.value.trim().toLowerCase())
    const matchesFavorites = !favoritesOnly.value || isFavorite(item)
    const matchesAvailability = !availableOnly.value || item.variants.some((variant) => variant.availableAtStore !== false)
    return matchesCategory && matchesSearch && matchesFavorites && matchesAvailability
  }),
)

const orderStatuses = computed(() => [
  'All',
  ...Array.from(new Set(orders.value.map((order) => order.orderStatus).filter(Boolean))).sort(),
])

const filteredOrders = computed(() => {
  const query = orderSearchTerm.value.trim().toLowerCase()

  const results = orders.value.filter((order) => {
    const matchesStatus = selectedOrderStatus.value === 'All' || order.orderStatus === selectedOrderStatus.value
    const matchesSearch =
      !query ||
      [
        order.locationName,
        order.city,
        order.state,
        formatOrderStatus(order.orderStatus),
        ...order.items.map((item) => item.name),
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))

    return matchesStatus && matchesSearch
  })

  return [...results].sort((left, right) => {
    if (orderSort.value === 'oldest') {
      return new Date(left.date).getTime() - new Date(right.date).getTime()
    }

    if (orderSort.value === 'highest-total') {
      return (right.total || 0) - (left.total || 0)
    }

    if (orderSort.value === 'lowest-total') {
      return (left.total || 0) - (right.total || 0)
    }

    return new Date(right.date).getTime() - new Date(left.date).getTime()
  })
})

const displayedOrders = computed(() => filteredOrders.value.slice(0, visibleOrderCount.value))
const hasMoreOrders = computed(() => filteredOrders.value.length > visibleOrderCount.value)

const selectedLocation = computed(() =>
  locations.value.find((location) => location.id === selectedStoreId.value) ?? null,
)
const selectedLocationLabel = computed(() =>
  selectedLocation.value ? formatStoreOptionLabel(selectedLocation.value, locations.value) : '',
)
const nearbyStores = computed(() =>
  (nearbyLocationSuggestions.value.length
    ? nearbyLocationSuggestions.value
    : sortNearbyLocations(locations.value, selectedLocation.value, userCoordinates.value)
  )
    .filter((location) => location.id !== selectedStoreId.value)
    .slice(0, 3),
)
const nearbyLocationSuggestions = ref([])

const cartItemCount = computed(() =>
  cart.value.reduce((total, item) => total + item.quantity, 0),
)

const cartSubtotal = computed(() =>
  cart.value.reduce((total, item) => total + item.price * item.quantity, 0),
)

const estimatedTax = computed(() => Number((cartSubtotal.value * 0.07).toFixed(2)))
const estimatedTotal = computed(() => Number((cartSubtotal.value + estimatedTax.value).toFixed(2)))
const availableMenuItemIds = computed(() =>
  new Set(
    menuItems.value
      .filter((item) => item.availableAtStore !== false)
      .map((item) => item.id),
  ),
)
const unavailableCartItems = computed(() =>
  cart.value.filter((item) => !availableMenuItemIds.value.has(item.id)),
)
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function parseLocalDateTime(value) {
  if (!value) {
    return null
  }

  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)

  if (!match) {
    return null
  }

  const [, year, month, day, hours, minutes] = match
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    0,
    0,
  )

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function normalizeDayKey(value) {
  return String(value || '')
    .trim()
    .slice(0, 3)
    .toLowerCase()
}

function timeToMinutes(value) {
  if (!value && value !== 0) {
    return null
  }

  const normalized = String(value).trim()
  const compactMatch = normalized.match(/^(\d{3,4})$/)

  if (compactMatch) {
    const digits = compactMatch[1].padStart(4, '0')
    return Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2, 4))
  }

  const timeMatch = normalized.match(/^(\d{1,2}):(\d{2})/)

  if (timeMatch) {
    return Number(timeMatch[1]) * 60 + Number(timeMatch[2])
  }

  return null
}

function serializePickupTime(value) {
  const parsed = parseLocalDateTime(value)
  return parsed ? parsed.toISOString() : null
}

function resolveUserCoordinates() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      () => resolve(null),
      {
        enableHighAccuracy: false,
        timeout: 3000,
        maximumAge: 300000,
      },
    )
  })
}

async function loadNearbySuggestions() {
  if (!userCoordinates.value?.latitude || !userCoordinates.value?.longitude) {
    nearbyLocationSuggestions.value = []
    return
  }

  try {
    const suggestions = await fetchNearbyLocations(userCoordinates.value.latitude, userCoordinates.value.longitude, {
      orderableOnly: true,
      openForBusiness: true,
      limit: 4,
    })
    nearbyLocationSuggestions.value = suggestions
  } catch {
    nearbyLocationSuggestions.value = []
  }
}

function clearPickupTime() {
  pickupTime.value = ''
  scheduleMismatch.value = false
  submitError.value = ''
}

function toDateTimeLocalValue(value) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function setMinutesOnDate(date, totalMinutes) {
  const next = new Date(date)
  next.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0)
  return next
}

function getPickupScheduleForDate(location, date) {
  if (!location?.hours || typeof location.hours !== 'object' || !(date instanceof Date)) {
    return null
  }

  const targetDay = normalizeDayKey(WEEKDAYS[date.getDay()])
  const entry = Object.entries(location.hours).find(([day]) => normalizeDayKey(day) === targetDay)

  if (!entry) {
    return null
  }

  const [label, value] = entry
  return {
    label,
    open: value?.open ?? '',
    close: value?.close ?? '',
  }
}

function findNextScheduledPickup(baseDate, offsetMinutes) {
  const store = selectedLocation.value
  const base = new Date(baseDate)

  if (!store) {
    return null
  }

  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const candidateDay = new Date(base)
    candidateDay.setDate(base.getDate() + dayOffset)
    const schedule = getPickupScheduleForDate(store, candidateDay)

    if (!schedule?.open || !schedule?.close) {
      continue
    }

    const openMinutes = timeToMinutes(schedule.open)
    const closeMinutes = timeToMinutes(schedule.close)

    if (openMinutes === null || closeMinutes === null) {
      continue
    }

    let candidate = new Date(candidateDay)

    if (dayOffset === 0) {
      candidate = new Date(base.getTime() + offsetMinutes * 60000)
      const candidateMinutes = candidate.getHours() * 60 + candidate.getMinutes()

      if (candidateMinutes < openMinutes) {
        candidate = setMinutesOnDate(candidateDay, openMinutes + offsetMinutes)
      }

      if (candidate.getDate() !== candidateDay.getDate() || (candidate.getHours() * 60 + candidate.getMinutes()) > closeMinutes) {
        continue
      }

      return candidate
    }

    candidate = setMinutesOnDate(candidateDay, openMinutes + offsetMinutes)

    if ((candidate.getHours() * 60 + candidate.getMinutes()) <= closeMinutes) {
      return candidate
    }
  }

  return null
}

function applyPickupPreset(preset) {
  submitError.value = ''
  scheduleMismatch.value = false

  if (preset === 'asap') {
    clearPickupTime()
    return
  }

  const offsetMinutes = Number(preset)

  if (!selectedLocation.value || Number.isNaN(offsetMinutes)) {
    return
  }

  const nextPickup = findNextScheduledPickup(new Date(), offsetMinutes)

  if (!nextPickup) {
    submitError.value = 'We could not find a good scheduled pickup slot for this store right now. Try ASAP or pick a time manually.'
    return
  }

  pickupTime.value = toDateTimeLocalValue(nextPickup)
}

const selectedPickupSchedule = computed(() => {
  const parsed = parseLocalDateTime(pickupTime.value)

  if (!parsed || !selectedLocation.value) {
    return null
  }

  return getPickupScheduleForDate(selectedLocation.value, parsed)
})

const pickupHoursHint = computed(() => {
  if (!selectedLocation.value) {
    return ''
  }

  if (pickupTime.value) {
    const parsed = parseLocalDateTime(pickupTime.value)
    const schedule = selectedPickupSchedule.value

    if (!parsed) {
      return 'Use the picker to choose a valid pickup date and time.'
    }

    const dayLabel = WEEKDAYS[parsed.getDay()]

    if (!schedule?.open || !schedule?.close) {
      return `${dayLabel} is closed for pickup at this store.`
    }

    return `${dayLabel} pickup hours: ${formatHoursRange(schedule.open, schedule.close)}`
  }

  if (selectedLocation.value.hoursToday?.open && selectedLocation.value.hoursToday?.close) {
    return `Today's pickup hours: ${selectedLocation.value.hoursTodayLabel}`
  }

  return 'Choose a pickup date and time if you want the store to aim for a specific handoff window.'
})

const pickupTimeError = computed(() => {
  if (!pickupTime.value || !selectedLocation.value) {
    return ''
  }

  const parsed = parseLocalDateTime(pickupTime.value)

  if (!parsed) {
    return 'Choose a valid pickup date and time.'
  }

  const schedule = selectedPickupSchedule.value
  const dayLabel = WEEKDAYS[parsed.getDay()]

  if (!schedule?.open || !schedule?.close) {
    return `${dayLabel} is closed for pickup at this store.`
  }

  const minutes = parsed.getHours() * 60 + parsed.getMinutes()
  const openMinutes = timeToMinutes(schedule.open)
  const closeMinutes = timeToMinutes(schedule.close)

  if (openMinutes === null || closeMinutes === null) {
    return ''
  }

  if (minutes < openMinutes || minutes > closeMinutes) {
    return `${dayLabel} pickup time must be during store hours: ${formatHoursRange(schedule.open, schedule.close)}.`
  }

  return ''
})

function itemKey(item) {
  return `${item.id}-${item.size || 'default'}`
}

function getSelectedVariant(group) {
  const selectedVariantId = selectedVariantByGroup.value[group.id]

  return group.variants.find((variant) => variant.id === selectedVariantId)
    ?? group.defaultVariant
    ?? group.variants[0]
    ?? null
}

function buildCartItem(group) {
  const variant = getSelectedVariant(group)

  if (!variant) {
    return null
  }

  return {
    id: variant.id,
    name: group.name,
    size: variant.size,
    category: group.category,
    price: variant.price,
    priceDisplay: variant.priceDisplay,
    calories: variant.calories,
    availableAtStore: variant.availableAtStore,
  }
}

function syncSelectedVariants(items) {
  const groupedItems = groupMenuItems(items)

  selectedVariantByGroup.value = groupedItems.reduce((result, group) => {
    const previousSelection = selectedVariantByGroup.value[group.id]
    const matchingVariant = group.variants.find((variant) => variant.id === previousSelection)

    result[group.id] = matchingVariant?.id ?? group.defaultVariant?.id ?? group.variants[0]?.id ?? ''
    return result
  }, {})
}

function applyMenuItems(items) {
  menuItems.value = items
  syncSelectedVariants(items)
  reconcileCartWithMenu(items)
}

async function chooseDefaultStore(locationResult) {
  if (!locationResult.length) {
    selectedStoreId.value = ''
    return
  }

  if (selectedStoreId.value && locationResult.some((location) => location.id === selectedStoreId.value)) {
    return
  }

  const preferredStoreId =
    authStore.currentUser?.preferredStoreId
    || authStore.currentUser?.preferredStore?.locationId
    || authStore.currentUser?.preferredStore?.location_id
    || authStore.currentUser?.preferredStore?.id

  if (preferredStoreId) {
    const preferredStore = locationResult.find((location) => location.id === preferredStoreId)

    if (preferredStore) {
      selectedStoreId.value = preferredStore.id
      return
    }
  }

  userCoordinates.value = await resolveUserCoordinates()
  await loadNearbySuggestions()
  const closestStore =
    nearbyLocationSuggestions.value.find((location) => locationResult.some((entry) => entry.id === location.id))
    ?? findClosestLocation(locationResult, userCoordinates.value)
  selectedStoreId.value = closestStore?.id ?? locationResult[0].id
}

function reconcileCartWithMenu(items) {
  if (!cart.value.length) {
    return
  }

  const validIds = new Set(
    items
      .filter((item) => item.availableAtStore !== false)
      .map((item) => item.id),
  )

  const nextCart = cart.value.filter((item) => validIds.has(item.id))

  if (nextCart.length !== cart.value.length) {
    cart.value = nextCart
    submitError.value = 'Some items were removed because they are not available at the selected pickup store.'
  }
}

function selectVariant(groupId, variantId) {
  selectedVariantByGroup.value = {
    ...selectedVariantByGroup.value,
    [groupId]: variantId,
  }
}

function isFavorite(group) {
  return group.variants.some((variant) => explicitFavoriteIds.value.has(variant.id))
}

function addFavoriteToCart(favorite) {
  const matchingGroup = groupedMenuItems.value.find((group) =>
    group.variants.some((variant) => variant.id === favorite.menuItemId),
  )
  const matchingVariant =
    matchingGroup?.variants.find((variant) => variant.id === favorite.menuItemId)
    ?? matchingGroup?.variants.find((variant) => variant.size === favorite.defaultSize)
    ?? matchingGroup?.variants[0]

  if (!matchingGroup || !matchingVariant) {
    return
  }

  addToCart({
    id: matchingVariant.id,
    name: matchingGroup.name,
    size: matchingVariant.size,
    category: matchingGroup.category || favorite.category,
    price: matchingVariant.price,
    availableAtStore: matchingVariant.availableAtStore,
  })
}

async function toggleFavorite(group) {
  favoriteError.value = ''
  const currentFavoriteVariant = group.variants.find((variant) => explicitFavoriteIds.value.has(variant.id))
  const targetVariant = currentFavoriteVariant ?? getSelectedVariant(group)

  if (!targetVariant?.id) {
    return
  }

  try {
    if (currentFavoriteVariant) {
      await deleteFavorite(currentFavoriteVariant.id)
      const next = new Set(explicitFavoriteIds.value)
      next.delete(currentFavoriteVariant.id)
      explicitFavoriteIds.value = next
      return
    }

    await createFavorite(targetVariant.id)
    const next = new Set(explicitFavoriteIds.value)
    next.add(targetVariant.id)
    explicitFavoriteIds.value = next
  } catch (error) {
    favoriteError.value = error.message
  }
}

function setPanel(panel) {
  activePanel.value = panel
}

function addToCart(item) {
  if (!item) {
    return
  }

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

async function addOrderToCart(order) {
  submitError.value = ''
  submitSuccess.value = null

  if (order.storeId && order.storeId !== selectedStoreId.value) {
    selectedStoreId.value = order.storeId
    await refreshMenuForSelectedStore()
  }

  order.items.forEach((item) => {
    addToCart({
      id: item.menuItemId,
      name: item.name,
      size: item.size,
      category: '',
      price: item.unitPrice || item.price,
    })
  })

  activePanel.value = 'builder'
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

function clearOrderFilters() {
  orderSearchTerm.value = ''
  selectedOrderStatus.value = 'All'
  orderSort.value = 'newest'
  visibleOrderCount.value = 6
}

function clearMenuFilters() {
  menuSearchTerm.value = ''
  selectedCategory.value = 'All'
  favoritesOnly.value = false
  availableOnly.value = true
}

function showAllOrders() {
  visibleOrderCount.value = filteredOrders.value.length
}

async function loadOrders() {
  ordersLoading.value = true
  ordersError.value = ''
  orderItemsLimited.value = false
  dashboardPointsHistory.value = []

  try {
    orders.value = await fetchSessionMemberOrders({ includeItems: true, limit: 50 })
  } catch (error) {
    const message = String(error.message || '')

    if (message.toLowerCase().includes('database query failed') || message.includes('500')) {
      try {
        orders.value = await fetchSessionMemberOrders({ includeItems: false, limit: 50 })
        orderItemsLimited.value = true
        return
      } catch (fallbackError) {
        try {
          const dashboard = await fetchMemberDashboard()
          orders.value = dashboard.orders || []
          dashboardPointsHistory.value = dashboard.pointsHistory || []
          orderItemsLimited.value = true
          return
        } catch (dashboardError) {
          ordersError.value = formatFeatureError(dashboardError.message, 'Orders')
          return
        }
      }
    }

    ordersError.value = formatFeatureError(message, 'Orders')
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
  favoriteError.value = ''

  try {
    const locationResult = await fetchOrderableLocations()
    locations.value = locationResult

    if (!locationResult.length) {
      menuItems.value = []
      builderError.value = 'No pickup stores are currently available for ordering.'
      return
    }

    await chooseDefaultStore(locationResult)

    const menuResult = await fetchMenuForStore(selectedStoreId.value)
    applyMenuItems(menuResult)
  } catch (error) {
    builderError.value = error.message
  } finally {
    builderLoading.value = false
  }

  try {
    const favorites = await fetchSessionMemberFavorites({ limit: 50, storeId: selectedStoreId.value || undefined })
    favoriteItems.value = favorites
    explicitFavoriteIds.value = new Set(
      favorites
        .filter((favorite) => favorite.isExplicit)
        .map((favorite) => favorite.menuItemId),
    )
  } catch (error) {
    favoriteError.value = error.message
  }
}

async function refreshMenuForSelectedStore() {
  builderLoading.value = true
  builderError.value = ''
  favoriteError.value = ''

  try {
    const menuResult = await fetchMenuForStore(selectedStoreId.value)
    applyMenuItems(menuResult)
    const favorites = await fetchSessionMemberFavorites({ limit: 50, storeId: selectedStoreId.value || undefined })
    favoriteItems.value = favorites
    explicitFavoriteIds.value = new Set(
      favorites
        .filter((favorite) => favorite.isExplicit)
        .map((favorite) => favorite.menuItemId),
    )
  } catch (error) {
    builderError.value = error.message
  } finally {
    builderLoading.value = false
  }
}

async function submitOrder() {
  submitError.value = ''
  submitSuccess.value = null
  scheduleMismatch.value = false

  if (!selectedStoreId.value) {
    submitError.value = 'Choose a pickup store before placing your order.'
    return
  }

  if (!isStoreOrderable(selectedLocation.value)) {
    submitError.value = selectedLocation.value?.availabilityMessage || 'This store is not yet open for ordering. Coming Soon!'
    return
  }

  if (!cart.value.length) {
    submitError.value = 'Add at least one menu item to your order.'
    return
  }

  if (unavailableCartItems.value.length) {
    submitError.value = 'Your cart still has items that are not available at this pickup store.'
    return
  }

  if (pickupTimeError.value) {
    submitError.value = pickupTimeError.value
    return
  }

  isSubmitting.value = true

  try {
    const payload = {
      store_id: selectedStoreId.value,
      items: cart.value.map((item) => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        size: item.size || null,
      })),
      payment_method: 'pay_in_store',
      special_instructions: specialInstructions.value.trim() || null,
    }

    const serializedPickupTime = serializePickupTime(pickupTime.value)

    if (serializedPickupTime) {
      payload.pickup_time = serializedPickupTime
    }

    const createdOrder = await createPickupOrder(payload)

    submitSuccess.value = createdOrder
    cart.value = []
    pickupTime.value = ''
    specialInstructions.value = ''
    activePanel.value = 'history'
    await Promise.all([loadOrders(), loadPoints()])
    if (createdOrder?.id || createdOrder?.order_id) {
      await router.push({
        name: 'order-confirmation',
        params: { orderId: createdOrder.id || createdOrder.order_id },
      })
    }
  } catch (error) {
    submitError.value = error.message
    scheduleMismatch.value =
      String(error.message || '').toLowerCase().includes('closed on') ||
      String(error.message || '').toLowerCase().includes('during store hours')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadOrders()
  loadPoints()
  loadBuilderData()
})

watch([pickupTime, selectedStoreId], () => {
  scheduleMismatch.value = false
})
</script>

<template>
  <section class="section section--catalog">
    <div class="container dashboard-stack">
      <div class="section-heading section-heading--left section-heading--wide">
        <span class="eyebrow">Pickup Ordering</span>
        <h1>Pickup orders and previous visits</h1>
        <p>Build your next pickup order fast, or switch over to your previous Coffee Club orders without digging through a long page.</p>
      </div>

      <div class="dashboard-hero-grid">
        <DashboardPoints
          :points="points"
          :is-loading="pointsLoading"
          :error-message="pointsError"
          @retry="loadPoints"
        />

        <BaseCard class="panel-card panel-card--soft" padding="lg">
          <p class="eyebrow">Quick View</p>
          <h2>Order at a glance</h2>
          <div class="orders-overview-grid">
            <div class="favorite-link">
              <strong>{{ cartItemCount }}</strong>
              <span>items in your current pickup cart</span>
            </div>
            <div class="favorite-link">
              <strong>{{ orders.length }}</strong>
              <span>previous orders in your Coffee Club history</span>
            </div>
            <div class="favorite-link">
              <strong>{{ formatCurrency(estimatedTotal) }}</strong>
              <span>estimated total for this pickup order</span>
            </div>
          </div>
        </BaseCard>
      </div>

      <div class="orders-toggle">
        <button
          type="button"
          :class="['orders-toggle__button', { 'orders-toggle__button--active': activePanel === 'builder' }]"
          @click="setPanel('builder')"
        >
          Start Order
        </button>
        <button
          type="button"
          :class="['orders-toggle__button', { 'orders-toggle__button--active': activePanel === 'history' }]"
          @click="setPanel('history')"
        >
          Previous Orders
        </button>
      </div>

      <div v-if="activePanel === 'builder'" class="order-builder-layout order-builder-layout--sticky">
        <BaseCard padding="lg" class="order-builder-sidebar panel-card panel-card--soft">
          <div class="section-heading section-heading--left section-heading--compact">
            <span class="eyebrow">Pickup Setup</span>
            <h2>Store and cart</h2>
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
              <input
                v-model="storeSearchTerm"
                class="base-input"
                type="text"
                placeholder="Search by city, street, or keyword"
              />
              <select v-model="selectedStoreId" class="base-input base-select" @change="refreshMenuForSelectedStore">
                <option disabled value="">Choose a store</option>
                <option
                  v-for="location in filteredStoreOptions"
                  :key="location.id"
                  :value="location.id"
                >
                  {{ formatStoreOptionLabel(location, locations) }}
                </option>
              </select>
              <p v-if="storeSearchTerm && !filteredStoreOptions.length" class="helper-text helper-text--compact">
                No stores match that search yet.
              </p>
            </label>

            <div v-if="selectedLocation" class="order-store-summary">
              <strong>{{ selectedLocationLabel }}</strong>
              <span v-if="selectedLocation.address || selectedLocation.fullAddress">{{ selectedLocation.address || selectedLocation.fullAddress }}</span>
              <span v-if="selectedLocation.phone">Phone: {{ formatPhone(selectedLocation.phone) }}</span>
              <span v-if="selectedLocation.hoursTodayLabel">Today: {{ selectedLocation.hoursTodayLabel }}</span>
              <span
                v-if="!isStoreOrderable(selectedLocation) && selectedLocation.availabilityMessage"
                class="helper-text helper-text--warning"
              >
                {{ selectedLocation.availabilityMessage }}
              </span>
            </div>

            <div v-if="nearbyStores.length" class="nearby-store-section">
              <span class="input-label">Nearby Stores</span>
              <div class="nearby-store-list">
                <button
                  v-for="location in nearbyStores"
                  :key="location.id"
                  type="button"
                  class="nearby-store-chip"
                  @click="selectedStoreId = location.id; refreshMenuForSelectedStore()"
                >
                  {{ formatStoreOptionLabel(location, locations) }}
                </button>
              </div>
            </div>

            <div class="order-summary">
              <label class="input-group">
                <span class="input-label">Pickup time</span>
                <input v-model="pickupTime" class="base-input" type="datetime-local" />
              </label>
              <div class="pickup-shortcuts">
                <button
                  type="button"
                  :class="['pickup-shortcuts__button', { 'pickup-shortcuts__button--active': !pickupTime }]"
                  @click="applyPickupPreset('asap')"
                >
                  ASAP
                </button>
                <button
                  type="button"
                  class="pickup-shortcuts__button"
                  @click="applyPickupPreset(15)"
                >
                  In 15 min
                </button>
                <button
                  type="button"
                  class="pickup-shortcuts__button"
                  @click="applyPickupPreset(30)"
                >
                  In 30 min
                </button>
              </div>
              <label class="input-group">
                <span class="input-label">Special instructions</span>
                <textarea
                  v-model="specialInstructions"
                  class="base-input base-textarea"
                  rows="3"
                  placeholder="Extra hot, no whip, or pickup notes"
                ></textarea>
              </label>
              <p class="helper-text helper-text--compact">{{ pickupHoursHint }}</p>
              <p v-if="pickupTimeError" class="helper-text helper-text--error">{{ pickupTimeError }}</p>
              <p v-if="scheduleMismatch" class="helper-text helper-text--warning">
                The backend reported a different pickup schedule than the location feed. Try another time or store while that sync issue gets corrected.
              </p>
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
                  <p
                    v-if="unavailableCartItems.some((cartItem) => cartItem.key === item.key)"
                    class="helper-text helper-text--warning"
                  >
                    Not available at the selected store.
                  </p>
                </div>

                <div class="cart-line__controls">
                  <button class="quantity-button" type="button" @click="updateQuantity(item.key, item.quantity - 1)">−</button>
                  <span>{{ item.quantity }}</span>
                  <button class="quantity-button" type="button" @click="updateQuantity(item.key, item.quantity + 1)">+</button>
                </div>

                <strong>{{ formatCurrency(item.price * item.quantity) }}</strong>
                <button class="card-link" type="button" @click="removeFromCart(item.key)">Remove</button>
              </div>
            </div>
            <EmptyState
              v-else
              compact
              title="Your cart is empty"
              description="Add drinks from the menu browser to get started."
            />

            <p v-if="submitError" class="helper-text helper-text--error">{{ submitError }}</p>

            <BaseButton :disabled="isSubmitting || !cart.length || !selectedStoreId || !isStoreOrderable(selectedLocation)" block @click="submitOrder">
              {{ isSubmitting ? 'Placing Order...' : 'Place Pickup Order' }}
            </BaseButton>
          </div>
        </BaseCard>

        <div class="orders-builder-main">
          <BaseCard class="panel-card panel-card--flat" padding="lg">
            <div class="section-heading section-heading--left section-heading--compact">
              <span class="eyebrow">Menu Browser</span>
              <h2>Add drinks and cafe favorites</h2>
            </div>

            <div v-if="favoriteGroups.length" class="favorites-panel favorites-panel--compact">
              <div class="card-topline">
                <span class="input-label">Favorites</span>
                <span class="helper-text helper-text--compact">Quick reordering for your usuals</span>
              </div>
              <div class="favorites-list favorites-list--compact">
                <div v-for="item in favoriteGroups" :key="item.id" class="favorite-link favorite-link--compact">
                  <div>
                    <strong>{{ item.name }}</strong>
                    <span>{{ [item.category, item.displaySize, item.displayPriceLabel].filter(Boolean).join(' • ') }}</span>
                  </div>
                  <BaseButton
                    size="sm"
                    variant="secondary"
                    :disabled="item.availableAtStore === false"
                    @click="addFavoriteToCart(item)"
                  >
                    {{ item.availableAtStore === false ? 'Unavailable' : 'Add' }}
                  </BaseButton>
                </div>
              </div>
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
            <div class="filters-inline">
              <label class="filter-chip-toggle">
                <input v-model="favoritesOnly" type="checkbox" />
                <span>Favorites only</span>
              </label>
              <label class="filter-chip-toggle">
                <input v-model="availableOnly" type="checkbox" />
                <span>Available at this store</span>
              </label>
              <BaseButton size="sm" variant="ghost" @click="clearMenuFilters">Clear menu filters</BaseButton>
            </div>

            <div v-if="!builderLoading && !builderError && filteredMenuItems.length" class="order-menu-grid">
              <article
                v-for="item in filteredMenuItems"
                :key="item.id"
                class="order-menu-item"
              >
                <div class="card-topline">
                  <span v-if="item.category" class="badge">{{ item.category }}</span>
                  <span class="price-tag">
                    {{ getSelectedVariant(item)?.priceDisplay || formatCurrency(getSelectedVariant(item)?.price) }}
                  </span>
                </div>
                <h3>{{ item.name }}</h3>
                <div class="card-topline">
                  <span
                    v-if="getSelectedVariant(item)?.storeAvailabilityStatus"
                    class="helper-text helper-text--compact"
                  >
                    {{ getSelectedVariant(item)?.storeAvailabilityStatus }}
                  </span>
                  <button
                    class="favorite-toggle"
                    type="button"
                    :aria-pressed="isFavorite(item)"
                    @click="toggleFavorite(item)"
                  >
                    {{ isFavorite(item) ? '★ Saved' : '☆ Save' }}
                  </button>
                </div>
                <p class="card-copy">
                  {{
                    [
                      getSelectedVariant(item)?.size,
                      getSelectedVariant(item)?.calories !== null && getSelectedVariant(item)?.calories !== undefined
                        ? `${getSelectedVariant(item)?.calories} cal`
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' • ')
                  }}
                </p>
                <div v-if="item.variants.length > 1" class="size-toggle-group">
                  <button
                    v-for="variant in item.variants"
                    :key="variant.id"
                    type="button"
                    :class="['size-toggle', { 'size-toggle--active': getSelectedVariant(item)?.id === variant.id }]"
                    @click="selectVariant(item.id, variant.id)"
                  >
                    {{ variant.size }}
                  </button>
                </div>
                <BaseButton
                  size="sm"
                  :disabled="getSelectedVariant(item)?.availableAtStore === false"
                  @click="addToCart(buildCartItem(item))"
                >
                  {{ getSelectedVariant(item)?.availableAtStore === false ? 'Unavailable at Store' : 'Add to Order' }}
                </BaseButton>
              </article>
            </div>

            <p v-if="favoriteError" class="helper-text helper-text--error">{{ favoriteError }}</p>

            <EmptyState
              v-else-if="!builderLoading && !builderError"
              compact
              title="No menu matches your filters"
              description="Try another search term or category."
            />
          </BaseCard>
        </div>
      </div>

      <div v-else class="dashboard-stack">
        <div class="dashboard-hero-grid">
        <BaseCard class="panel-card panel-card--flat" padding="lg">
            <p class="eyebrow">History Filters</p>
            <h2>Find a previous order faster</h2>
            <div class="filters-grid filters-grid--three">
              <label class="input-group">
                <span class="input-label">Search orders</span>
                <input
                  v-model="orderSearchTerm"
                  class="base-input"
                  type="text"
                  placeholder="Search by store, status, or item"
                />
              </label>

              <label class="input-group">
                <span class="input-label">Status</span>
                <select v-model="selectedOrderStatus" class="base-input base-select">
                  <option v-for="status in orderStatuses" :key="status" :value="status">
                    {{ status === 'All' ? status : formatOrderStatus(status) }}
                  </option>
                </select>
              </label>

              <label class="input-group">
                <span class="input-label">Sort</span>
                <select v-model="orderSort" class="base-input base-select">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="highest-total">Highest total</option>
                  <option value="lowest-total">Lowest total</option>
                </select>
              </label>
            </div>

            <div class="filters-actions">
              <BaseButton size="sm" variant="ghost" @click="clearOrderFilters">Clear filters</BaseButton>
            </div>
            <p v-if="orderItemsLimited" class="helper-text helper-text--compact">
              Detailed line items are temporarily unavailable from the backend, so reorder and item-level search are limited right now.
            </p>
          </BaseCard>

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

        <OrderHistory
          :orders="displayedOrders"
          :is-loading="ordersLoading"
          :error-message="ordersError"
          eyebrow="Previous Orders"
          title="Your previous pickup orders"
          show-reorder
          @retry="loadOrders"
          @reorder="addOrderToCart"
        />

        <div v-if="!ordersLoading && !ordersError && filteredOrders.length" class="hero-actions">
          <BaseButton v-if="hasMoreOrders" variant="secondary" @click="showAllOrders">Show All Orders</BaseButton>
          <BaseButton
            v-if="displayedOrders.length && displayedOrders[0].items.length"
            variant="ghost"
            @click="addOrderToCart(displayedOrders[0])"
          >
            Reorder Latest
          </BaseButton>
        </div>
      </div>
    </div>
  </section>
</template>
