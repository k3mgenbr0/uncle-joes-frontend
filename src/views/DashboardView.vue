<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import DashboardPoints from '../components/DashboardPoints.vue'
import OrderHistory from '../components/OrderHistory.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import { useAuthStore } from '../stores/auth'
import { fetchMemberDashboard, fetchMemberFavorites, fetchMemberOrders } from '../services/membersService'
import { formatMonthDay, formatPhone, formatStoreLabel, formatDate } from '../utils/formatters'

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
    pointsError.value = error.message
    ordersError.value = error.message
    favoritesError.value = error.message
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
    ordersError.value = error.message
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
    favoritesError.value = error.message
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
            <div>
              <dt>Email</dt>
              <dd>{{ authStore.currentUser?.email || 'Unavailable' }}</dd>
            </div>
            <div>
              <dt>Rewards Tier</dt>
              <dd>{{ authStore.currentUser?.tier || 'Standard' }}</dd>
            </div>
            <div>
              <dt>Points to Next Reward</dt>
              <dd>{{ authStore.currentUser?.pointsToNextReward ?? 'Unavailable' }}</dd>
            </div>
            <div>
              <dt>Join Date</dt>
              <dd>{{ formatDate(authStore.currentUser?.joinDate) }}</dd>
            </div>
            <div>
              <dt>Birthday</dt>
              <dd>{{ formatMonthDay(authStore.currentUser?.birthdayMonthDay) }}</dd>
            </div>
            <div>
              <dt>Marketing Opt In</dt>
              <dd>
                {{
                  authStore.currentUser?.marketingOptIn === null
                    ? 'Unavailable'
                    : authStore.currentUser?.marketingOptIn
                      ? 'Yes'
                      : 'No'
                }}
              </dd>
            </div>
          </dl>
        </BaseCard>
      </div>

      <div class="dashboard-hero-grid">
        <BaseCard class="member-card" padding="lg">
          <p class="eyebrow">Preferred Store</p>
          <h2>
            {{
              preferredStore
                ? formatStoreLabel(preferredStore?.store_name, preferredStore?.city, preferredStore?.state)
                : 'No preferred store yet'
            }}
          </h2>
          <p class="detail-lead">
            {{ preferredStore?.full_address || 'Set a preferred store in your member profile when available.' }}
          </p>
          <div class="detail-stack">
            <p class="detail-lead">Phone: {{ formatPhone(preferredStore?.phone) }}</p>
            <p class="detail-lead">Member ID: {{ authStore.currentUser?.id }}</p>
          </div>
        </BaseCard>

        <BaseCard padding="lg">
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
          <p v-else class="detail-lead">Favorite items will appear here once you have enough order history.</p>
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
