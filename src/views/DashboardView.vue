<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import DashboardPoints from '../components/DashboardPoints.vue'
import OrderHistory from '../components/OrderHistory.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import { useAuthStore } from '../stores/auth'
import { fetchMemberDashboard, fetchMemberFavorites, fetchMemberOrders } from '../services/membersService'
import { formatMonthDay, formatPhone, formatStoreLabel, formatDate, formatFeatureError } from '../utils/formatters'

const authStore = useAuthStore()

const points = ref(0)
const orders = ref([])
const favorites = ref([])
const pointsLoading = ref(true)
const ordersLoading = ref(true)
const favoritesLoading = ref(true)
const pointsError = ref('')
const ordersError = ref('')
const favoritesError = ref('')

const preferredStore = computed(() => authStore.currentUser?.preferredStore ?? null)

async function loadSummary() {
  pointsLoading.value = true
  ordersLoading.value = true
  favoritesLoading.value = true
  pointsError.value = ''
  ordersError.value = ''
  favoritesError.value = ''

  try {
    const [dashboardResult, favoritesResult] = await Promise.all([
      fetchMemberDashboard(),
      fetchMemberFavorites(authStore.currentUser.id),
    ])
    points.value = dashboardResult.points
    orders.value = dashboardResult.orders
    favorites.value = favoritesResult
  } catch (error) {
    pointsError.value = formatFeatureError(error.message, 'Rewards')
    ordersError.value = formatFeatureError(error.message, 'Orders')
    favoritesError.value = formatFeatureError(error.message, 'Favorites')
  } finally {
    pointsLoading.value = false
    ordersLoading.value = false
    favoritesLoading.value = false
  }
}

async function loadOrders() {
  ordersLoading.value = true
  ordersError.value = ''

  try {
    orders.value = await fetchMemberOrders(authStore.currentUser.id)
  } catch (error) {
    ordersError.value = formatFeatureError(error.message, 'Orders')
  } finally {
    ordersLoading.value = false
  }
}

async function loadFavorites() {
  favoritesLoading.value = true
  favoritesError.value = ''

  try {
    favorites.value = await fetchMemberFavorites(authStore.currentUser.id)
  } catch (error) {
    favoritesError.value = formatFeatureError(error.message, 'Favorites')
  } finally {
    favoritesLoading.value = false
  }
}

onMounted(() => {
  loadSummary()
})
</script>

<template>
  <section class="section">
    <div class="container dashboard-stack">
      <div class="section-heading section-heading--left">
        <span class="eyebrow">Coffee Club</span>
        <h1>Welcome back, {{ authStore.memberDisplayName }}</h1>
        <p>Keep up with your rewards, favorite drinks, and recent coffee runs in one place.</p>
      </div>

      <div class="dashboard-hero-grid">
        <DashboardPoints
          :points="points"
          :is-loading="pointsLoading"
          :error-message="pointsError"
          @retry="loadSummary"
        />

        <BaseCard class="member-card" padding="lg">
          <p class="eyebrow">Member Details</p>
          <h2>{{ authStore.memberDisplayName }}</h2>
          <dl class="member-details">
            <div v-if="authStore.currentUser?.email">
              <dt>Email</dt>
              <dd>{{ authStore.currentUser.email }}</dd>
            </div>
            <div v-if="authStore.currentUser?.tier">
              <dt>Rewards Tier</dt>
              <dd>{{ authStore.currentUser.tier }}</dd>
            </div>
            <div v-if="authStore.currentUser?.pointsToNextReward !== null && authStore.currentUser?.pointsToNextReward !== undefined">
              <dt>Points to Next Reward</dt>
              <dd>{{ authStore.currentUser.pointsToNextReward }}</dd>
            </div>
            <div v-if="authStore.currentUser?.joinDate">
              <dt>Join Date</dt>
              <dd>{{ formatDate(authStore.currentUser?.joinDate) }}</dd>
            </div>
            <div v-if="authStore.currentUser?.birthdayMonthDay">
              <dt>Birthday</dt>
              <dd>{{ formatMonthDay(authStore.currentUser?.birthdayMonthDay) }}</dd>
            </div>
            <div v-if="authStore.currentUser?.marketingOptIn !== null && authStore.currentUser?.marketingOptIn !== undefined">
              <dt>Marketing Opt In</dt>
              <dd>
                {{
                  authStore.currentUser?.marketingOptIn
                    ? 'Yes'
                    : 'No'
                }}
              </dd>
            </div>
          </dl>
        </BaseCard>
      </div>

      <div class="dashboard-hero-grid">
        <BaseCard v-if="preferredStore" class="member-card" padding="lg">
          <p class="eyebrow">Preferred Store</p>
          <h2>
            {{
              preferredStore
                ? formatStoreLabel(preferredStore?.store_name, preferredStore?.city, preferredStore?.state)
                : 'No preferred store yet'
            }}
          </h2>
          <p v-if="preferredStore?.full_address" class="detail-lead">{{ preferredStore.full_address }}</p>
          <div class="detail-stack">
            <p v-if="preferredStore?.phone" class="detail-lead">Phone: {{ formatPhone(preferredStore.phone) }}</p>
          </div>
        </BaseCard>

        <BaseCard v-if="favoritesLoading || favoritesError || favorites.length" padding="lg">
          <p class="eyebrow">Favorites</p>
          <h2>Your go-to orders</h2>

          <LoadingState
            v-if="favoritesLoading"
            compact
            title="Loading favorites"
            description="Looking up your most-loved menu items."
          />
          <ErrorState
            v-else-if="favoritesError"
            compact
            title="Favorites unavailable"
            :message="favoritesError"
            action-label="Try Again"
            @action="loadFavorites"
          />
          <div v-else-if="favorites.length" class="favorites-list">
            <RouterLink
              v-for="favorite in favorites"
              :key="favorite.id"
              :to="{ name: 'menu-item-detail', params: { itemId: favorite.id } }"
              class="favorite-link"
            >
              <strong>{{ favorite.name }}</strong>
              <span>{{ favorite.totalQuantity }} ordered • {{ favorite.totalOrders }} visits</span>
            </RouterLink>
          </div>
        </BaseCard>
      </div>

      <OrderHistory
        :orders="orders"
        :is-loading="ordersLoading"
        :error-message="ordersError"
        @retry="loadOrders"
      />
    </div>
  </section>
</template>
