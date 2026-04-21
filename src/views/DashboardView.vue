<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import DashboardPoints from '../components/DashboardPoints.vue'
import OrderHistory from '../components/OrderHistory.vue'
import ErrorState from '../components/ErrorState.vue'
import LoadingState from '../components/LoadingState.vue'
import EmptyState from '../components/EmptyState.vue'
import { useAuthStore } from '../stores/auth'
import { fetchMemberDashboard, fetchMemberRewards, fetchPointsHistory, fetchRewardsProgram, fetchRewardsRedemptions, fetchSessionMemberFavorites, fetchSessionMemberOrders } from '../services/membersService'
import { formatMonthDay, formatPhone, formatDate, formatFeatureError, formatTitleCase, formatCurrency } from '../utils/formatters'
import logoIcon from '../assets/branding/logo-icon.png'

const authStore = useAuthStore()

const points = ref(0)
const orders = ref([])
const favorites = ref([])
const pointsLoading = ref(true)
const ordersLoading = ref(true)
const favoritesLoading = ref(true)
const rewardsLoading = ref(true)
const activityLoading = ref(true)
const redemptionsLoading = ref(true)
const pointsError = ref('')
const ordersError = ref('')
const favoritesError = ref('')
const rewardsError = ref('')
const activityError = ref('')
const redemptionsError = ref('')
const dashboardMember = ref(null)
const rewardsSummary = ref(null)
const rewardsProgram = ref(null)
const pointsHistory = ref([])
const redemptions = ref([])
const redemptionTrackingEnabled = ref(false)
const historyRange = ref('90')

const memberRecord = computed(() => dashboardMember.value ?? authStore.currentUser ?? null)
const preferredStore = computed(() => memberRecord.value?.preferredStore ?? null)
const rewardTierLabel = computed(() => formatTitleCase(rewardsSummary.value?.rewardsTier || memberRecord.value?.tier || ''))
const rewardProgressPercent = computed(() => {
  const progress = Number(rewardsSummary.value?.currentRewardProgress ?? 0)
  const threshold = Number(rewardsSummary.value?.nextRewardThreshold ?? 0)

  if (!threshold || threshold <= 0) {
    return 0
  }

  return Math.max(0, Math.min(100, (progress / threshold) * 100))
})
const filteredPointsHistory = computed(() => {
  if (historyRange.value === 'all') {
    return pointsHistory.value
  }

  const days = Number(historyRange.value)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  return pointsHistory.value.filter((entry) => {
    const parsed = new Date(entry.date)
    return !Number.isNaN(parsed.getTime()) && parsed >= cutoff
  })
})

const recentPointsBars = computed(() => {
  const entries = filteredPointsHistory.value.slice(-6)
  const maxPoints = Math.max(...entries.map((entry) => entry.pointsEarned || 0), 1)

  return entries.map((entry) => ({
    ...entry,
    intensity:
      (entry.pointsEarned || 0) >= maxPoints * 0.8
        ? 'high'
        : (entry.pointsEarned || 0) >= maxPoints * 0.45
          ? 'medium'
          : 'low',
    height: `${Math.max(18, ((entry.pointsEarned || 0) / maxPoints) * 100)}%`,
  }))
})
const activeBonusPrograms = computed(() => [
  ...(rewardsSummary.value?.bonusPrograms || []),
  ...(rewardsProgram.value?.bonusPrograms || []),
])
const programMilestones = computed(() => {
  const seen = new Set()
  const milestones = []

  for (const tier of rewardsProgram.value?.tiers || []) {
    const key = `tier::${tier.name}::${tier.min_points}`

    if (!seen.has(key)) {
      seen.add(key)
      milestones.push({
        id: key,
        title: formatTitleCase(tier.name),
        subtitle: `${tier.min_points}+ points`,
      })
    }
  }

  for (const threshold of rewardsProgram.value?.rewardThresholds || []) {
    const key = `threshold::${threshold.name}::${threshold.points_required}`

    if (!seen.has(key)) {
      seen.add(key)
      milestones.push({
        id: key,
        title: threshold.name,
        subtitle: `${threshold.points_required} points required`,
      })
    }
  }

  return milestones
})

async function loadSummary() {
  pointsLoading.value = true
  ordersLoading.value = true
  favoritesLoading.value = true
  pointsError.value = ''
  ordersError.value = ''
  favoritesError.value = ''

  try {
    const dashboardResult = await fetchMemberDashboard()
    dashboardMember.value = dashboardResult.member
    points.value = dashboardResult.rewards?.currentPoints || dashboardResult.points
    orders.value = dashboardResult.orders
    favorites.value = dashboardResult.favorites
    rewardsSummary.value = dashboardResult.rewards ?? rewardsSummary.value
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
    orders.value = await fetchSessionMemberOrders({ includeItems: true, limit: 50 })
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
    favorites.value = await fetchSessionMemberFavorites({
      limit: 6,
      storeId: preferredStore.value?.locationId || preferredStore.value?.id || undefined,
    })
  } catch (error) {
    favoritesError.value = formatFeatureError(error.message, 'Favorites')
  } finally {
    favoritesLoading.value = false
  }
}

async function loadRewardsPanels() {
  pointsLoading.value = true
  rewardsLoading.value = true
  activityLoading.value = true
  redemptionsLoading.value = true
  pointsError.value = ''
  rewardsError.value = ''
  activityError.value = ''
  redemptionsError.value = ''

  try {
    const [rewardsResult, programResult, historyResult, redemptionsResult] = await Promise.all([
      fetchMemberRewards(),
      fetchRewardsProgram(),
      fetchPointsHistory(),
      fetchRewardsRedemptions(),
    ])
    rewardsSummary.value = rewardsResult
    rewardsProgram.value = programResult
    points.value = rewardsResult.currentPoints
    pointsHistory.value = historyResult
    redemptions.value = redemptionsResult.redemptions
    redemptionTrackingEnabled.value = redemptionsResult.redemptionTrackingEnabled
  } catch (error) {
    pointsError.value = formatFeatureError(error.message, 'Rewards')
    rewardsError.value = formatFeatureError(error.message, 'Rewards')
    activityError.value = formatFeatureError(error.message, 'Rewards activity')
    redemptionsError.value = formatFeatureError(error.message, 'Redemptions')
  } finally {
    pointsLoading.value = false
    rewardsLoading.value = false
    activityLoading.value = false
    redemptionsLoading.value = false
  }
}

onMounted(() => {
  loadSummary()
  loadRewardsPanels()
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
          :rewards="rewardsSummary"
          :is-loading="pointsLoading"
          :error-message="pointsError"
          @retry="loadRewardsPanels"
        />

        <BaseCard class="member-card" padding="lg">
          <div class="detail-brand-row detail-brand-row--compact">
            <img :src="logoIcon" alt="Uncle Joe's Coffee" class="detail-brand-row__logo" />
            <div>
              <p class="eyebrow">Member Details</p>
              <strong class="detail-brand-row__title">Your Coffee Club profile</strong>
            </div>
          </div>
          <h2>{{ authStore.memberDisplayName }}</h2>
          <dl class="member-details">
            <div v-if="memberRecord?.email">
              <dt>Email</dt>
              <dd>{{ memberRecord.email }}</dd>
            </div>
            <div v-if="memberRecord?.tier">
              <dt>Rewards Tier</dt>
              <dd>{{ rewardTierLabel || formatTitleCase(memberRecord.tier) }}</dd>
            </div>
            <div v-if="memberRecord?.pointsToNextReward !== null && memberRecord?.pointsToNextReward !== undefined">
              <dt>Points to Next Reward</dt>
              <dd>{{ rewardsSummary?.pointsToNextReward ?? memberRecord.pointsToNextReward }}</dd>
            </div>
            <div v-if="rewardsSummary?.lifetimePoints !== null && rewardsSummary?.lifetimePoints !== undefined">
              <dt>Lifetime Points</dt>
              <dd>{{ rewardsSummary.lifetimePoints }}</dd>
            </div>
            <div v-if="memberRecord?.joinDate">
              <dt>Join Date</dt>
              <dd>{{ formatDate(memberRecord?.joinDate) }}</dd>
            </div>
            <div v-if="memberRecord?.birthdayMonthDay">
              <dt>Birthday</dt>
              <dd>{{ formatMonthDay(memberRecord?.birthdayMonthDay) }}</dd>
            </div>
            <div v-if="memberRecord?.marketingOptIn !== null && memberRecord?.marketingOptIn !== undefined">
              <dt>Marketing Opt In</dt>
              <dd>
                {{
                  memberRecord?.marketingOptIn
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
              preferredStore?.displayName
                || preferredStore?.storeName
                || 'No preferred store yet'
            }}
          </h2>
          <p v-if="preferredStore?.address || preferredStore?.fullAddress" class="detail-lead">{{ preferredStore.address || preferredStore.fullAddress }}</p>
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
              <span>{{ [favorite.category, favorite.size || favorite.defaultSize, favorite.currentPrice ? `$${favorite.currentPrice.toFixed(2)}` : ''].filter(Boolean).join(' • ') }}</span>
            </RouterLink>
          </div>
        </BaseCard>
      </div>

      <div class="dashboard-hero-grid">
        <BaseCard padding="lg">
          <div class="card-topline">
            <div>
              <p class="eyebrow">Rewards Activity</p>
              <h2>Points earned by order</h2>
            </div>
            <label class="input-group rewards-range-control">
              <span class="input-label">Range</span>
              <select v-model="historyRange" class="base-input base-select">
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All recent</option>
              </select>
            </label>
          </div>

          <LoadingState
            v-if="activityLoading"
            compact
            title="Loading rewards activity"
            description="Looking up points earned across your recent orders."
          />
          <ErrorState
            v-else-if="activityError"
            compact
            title="Rewards activity unavailable"
            :message="activityError"
            action-label="Try Again"
            @action="loadRewardsPanels"
          />
          <div v-else-if="recentPointsBars.length" class="rewards-chart">
            <div
              v-for="entry in recentPointsBars"
              :key="entry.id"
              class="rewards-chart__item"
            >
              <span class="rewards-chart__value">{{ entry.pointsEarned }}</span>
              <span class="rewards-chart__track">
                <span
                  :class="['rewards-chart__bar', `rewards-chart__bar--${entry.intensity}`]"
                  :style="{ height: entry.height }"
                ></span>
              </span>
              <span class="rewards-chart__label">{{ formatDate(entry.date, { month: 'short', day: 'numeric' }) }}</span>
            </div>
          </div>
          <EmptyState
            v-else
            compact
            title="No rewards activity yet"
            description="Once you start ordering, your points-earned history will show up here."
          />
        </BaseCard>

        <BaseCard padding="lg">
          <p class="eyebrow">How Rewards Work</p>
          <h2>Program details</h2>

          <LoadingState
            v-if="rewardsLoading"
            compact
            title="Loading rewards program"
            description="Checking tier thresholds and milestone details."
          />
          <ErrorState
            v-else-if="rewardsError"
            compact
            title="Rewards program unavailable"
            :message="rewardsError"
            action-label="Try Again"
            @action="loadRewardsPanels"
          />
          <div v-else class="detail-stack">
            <p v-if="rewardsProgram?.pointsRule" class="detail-lead">{{ rewardsProgram.pointsRule }}</p>
            <div v-if="programMilestones.length" class="favorites-list">
              <div v-for="milestone in programMilestones" :key="milestone.id" class="favorite-link">
                <strong>{{ milestone.title }}</strong>
                <span>{{ milestone.subtitle }}</span>
              </div>
            </div>
            <div v-if="activeBonusPrograms.length" class="favorites-list">
              <div v-for="program in activeBonusPrograms" :key="program.id || program.title" class="favorite-link">
                <strong>{{ program.title || program.name }}</strong>
                <span>{{ program.description || 'Bonus earning opportunity available.' }}</span>
              </div>
            </div>
            <p v-if="rewardsSummary?.nextTierName" class="helper-text helper-text--compact">
              {{ rewardsSummary.pointsToNextReward }} points until {{ formatTitleCase(rewardsSummary.nextTierName) }}.
            </p>
          </div>
        </BaseCard>
      </div>

      <div class="dashboard-hero-grid">
        <BaseCard padding="lg">
          <p class="eyebrow">Recent Rewards</p>
          <h2>Points activity</h2>

          <LoadingState
            v-if="activityLoading"
            compact
            title="Loading points history"
            description="Pulling your recent rewards activity."
          />
          <ErrorState
            v-else-if="activityError"
            compact
            title="Points history unavailable"
            :message="activityError"
            action-label="Try Again"
            @action="loadRewardsPanels"
          />
          <div v-else-if="filteredPointsHistory.length" class="favorites-list">
            <div v-for="entry in filteredPointsHistory.slice(0, 6)" :key="entry.id" class="favorite-link">
              <strong>{{ formatDate(entry.date) }}</strong>
              <span>
                {{
                  [
                    entry.storeName || [entry.storeCity, entry.storeState].filter(Boolean).join(', '),
                    `${entry.pointsEarned} pts`,
                    formatCurrency(entry.orderTotal),
                    entry.activityType ? formatTitleCase(entry.activityType.replace(/_/g, ' ')) : '',
                  ].filter(Boolean).join(' • ')
                }}
              </span>
            </div>
          </div>
          <EmptyState
            v-else
            compact
            title="No points history yet"
            description="Your order-based point earnings will show up here."
          />
        </BaseCard>

        <BaseCard padding="lg">
          <p class="eyebrow">Redemptions</p>
          <h2>Used rewards</h2>

          <LoadingState
            v-if="redemptionsLoading"
            compact
            title="Loading redemptions"
            description="Checking whether you've redeemed any Coffee Club rewards yet."
          />
          <ErrorState
            v-else-if="redemptionsError"
            compact
            title="Redemptions unavailable"
            :message="redemptionsError"
            action-label="Try Again"
            @action="loadRewardsPanels"
          />
          <div v-else-if="redemptions.length" class="favorites-list">
            <div v-for="redemption in redemptions" :key="redemption.id" class="favorite-link">
              <strong>{{ redemption.rewardName }}</strong>
              <span>{{ formatDate(redemption.redeemedAt) }} • {{ redemption.pointsUsed }} points • {{ formatTitleCase(redemption.status) }}</span>
            </div>
          </div>
          <div v-else class="favorite-link">
            <strong>{{ redemptionTrackingEnabled ? 'No redemptions yet' : 'Reward redemptions are coming soon' }}</strong>
            <span>Your redeemed rewards will show up here once tracking is available.</span>
          </div>
        </BaseCard>
      </div>

      <OrderHistory
        :orders="orders"
        :is-loading="ordersLoading"
        :error-message="ordersError"
        eyebrow="Recent Orders"
        title="Your Order History"
        @retry="loadOrders"
      />
    </div>
  </section>
</template>
