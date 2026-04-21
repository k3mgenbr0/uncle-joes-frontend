import { apiFetch, extractCollection, extractRecord, getErrorMessage } from './api'
import { normalizeMember } from './authService'

function normalizePoints(payload) {
  const record = extractRecord(payload, ['points', 'data', 'member'])

  return {
    value: Number(
      record?.points ??
        record?.balance ??
        record?.total_points ??
        payload?.total_points ??
        record?.current_points ??
        0,
    ),
    raw: record,
  }
}

function normalizeRewardsSummary(payload) {
  const record = extractRecord(payload, ['rewards', 'data', 'summary']) ?? payload ?? {}

  return {
    memberId: String(record.member_id ?? ''),
    currentPoints: Number(record.current_points ?? record.points ?? 0),
    lifetimePoints: Number(record.lifetime_points ?? 0),
    rewardsTier: record.rewards_tier ?? '',
    pointsToNextReward: Number(record.points_to_next_reward ?? 0),
    nextTierName: record.next_tier_name ?? '',
    currentTierMinPoints: Number(record.current_tier_min_points ?? 0),
    nextTierMinPoints: Number(record.next_tier_min_points ?? 0),
    nextRewardThreshold: Number(record.next_reward_threshold ?? 0),
    currentRewardProgress: Number(record.current_reward_progress ?? record.current_points ?? 0),
    pointsEarnedLast30Days: Number(record.points_earned_last_30_days ?? 0),
    pointsEarnedLast90Days: Number(record.points_earned_last_90_days ?? 0),
    bonusPrograms: Array.isArray(record.bonus_programs) ? record.bonus_programs : [],
    raw: record,
  }
}

function normalizePointsHistoryEntry(entry) {
  return {
    id: String(entry.order_id ?? entry.id ?? ''),
    orderId: String(entry.order_id ?? entry.id ?? ''),
    date: entry.order_date ?? entry.date ?? '',
    storeId: String(entry.store_id ?? ''),
    storeName: entry.store_name ?? '',
    storeCity: entry.store_city ?? '',
    storeState: entry.store_state ?? '',
    orderTotal: Number(entry.order_total ?? entry.total ?? 0),
    pointsEarned: Number(entry.points_earned ?? 0),
    pointsRedeemed: Number(entry.points_redeemed ?? 0),
    activityType: entry.activity_type ?? '',
    raw: entry,
  }
}

function normalizeRewardRedemption(entry) {
  return {
    id: String(entry.redemption_id ?? entry.id ?? ''),
    redeemedAt: entry.redeemed_at ?? entry.date ?? '',
    rewardName: entry.reward_name ?? entry.name ?? '',
    pointsUsed: Number(entry.points_used ?? 0),
    status: entry.status ?? '',
    raw: entry,
  }
}

function normalizeRewardsProgram(payload) {
  const record = extractRecord(payload, ['program', 'data']) ?? payload ?? {}

  return {
    pointsRule: record.points_rule ?? '',
    tiers: Array.isArray(record.tiers) ? record.tiers : [],
    rewardThresholds: Array.isArray(record.reward_thresholds) ? record.reward_thresholds : [],
    bonusPrograms: Array.isArray(record.bonus_programs) ? record.bonus_programs : [],
    raw: record,
  }
}

function normalizeOrderItem(item) {
  return {
    id: String(
      item.id ??
        item.order_item_id ??
        item.item_id ??
        item.menu_item_id ??
        `${item.name ?? item.item_name ?? 'item'}`,
    ),
    menuItemId: String(item.menu_item_id ?? item.item_id ?? ''),
    name: item.name ?? item.item_name ?? '',
    size: item.size ?? item.item_size ?? '',
    quantity: Number(item.quantity ?? item.qty ?? 1),
    price: Number(item.price ?? item.unit_price ?? 0),
    unitPrice: Number(item.unit_price ?? item.price ?? 0),
    lineTotal: Number(item.line_total ?? (item.unit_price ?? item.price ?? 0) * (item.quantity ?? item.qty ?? 1)),
  }
}

function normalizeOrder(order) {
  const items = extractCollection(order.items ?? order.line_items ?? order.order_items ?? [], [])

  return {
    id: String(order.id ?? order.order_id ?? ''),
    memberId: String(order.member_id ?? ''),
    storeId: String(order.store_id ?? ''),
    date: order.order_date ?? order.date ?? order.created_at ?? '',
    pickupTime: order.pickup_time ?? '',
    readyByEstimate: order.ready_by_estimate ?? '',
    submittedAt: order.submitted_at ?? '',
    orderStatus: order.order_status ?? '',
    estimatedPrepMinutes: order.estimated_prep_minutes ?? null,
    specialInstructions: order.special_instructions ?? '',
    locationName: order.location_name ?? order.store_name ?? '',
    city: order.city ?? order.store_city ?? '',
    state: order.state ?? order.store_state ?? '',
    storePhone: order.store_phone ?? order.phone ?? '',
    location: order.location ?? null,
    itemsSubtotal: Number(order.items_subtotal ?? order.subtotal ?? 0),
    discount: Number(order.order_discount ?? order.discount ?? 0),
    tax: Number(order.sales_tax ?? order.tax ?? 0),
    total: Number(order.total ?? order.order_total ?? order.total_amount ?? 0),
    pointsEarned: Number(order.points_earned ?? 0),
    pointsRedeemed: Number(order.points_redeemed ?? 0),
    paymentSummary: order.payment_summary ?? null,
    items: items.map(normalizeOrderItem),
    raw: order,
  }
}

function normalizeFavoriteItem(item) {
  return {
    id: String(item.menu_item_id ?? item.item_id ?? ''),
    menuItemId: String(item.menu_item_id ?? item.item_id ?? ''),
    name: item.item_name ?? item.name ?? '',
    category: item.category ?? '',
    size: item.size ?? '',
    availableSizes: Array.isArray(item.available_sizes) ? item.available_sizes : [],
    defaultSize: item.default_size ?? '',
    currentPrice: Number(item.current_price ?? 0),
    imageUrl: item.image_url ?? '',
    availableAtStore: item.available_at_store ?? null,
    storeAvailabilityStatus: item.store_availability_status ?? '',
    isExplicit: Boolean(item.is_explicit ?? false),
    totalOrders: Number(item.total_orders ?? 0),
    totalQuantity: Number(item.total_quantity ?? 0),
    totalRevenue: Number(item.total_revenue ?? 0),
  }
}

function normalizeSummary(payload) {
  const record = extractRecord(payload, ['summary', 'data']) ?? {}

  return {
    member: normalizeMember(record.member ?? {}),
    points: normalizePoints(record.points ?? {}).value,
    recentOrders: extractCollection(record.recent_orders, ['orders']).map(normalizeOrder),
    favorites: extractCollection(record.favorites, ['items']).map(normalizeFavoriteItem),
    raw: record,
  }
}

export async function fetchMemberDashboard() {
  try {
    const response = await apiFetch('/api/member/dashboard?include_items=true&limit=6', { auth: true })
    const record = extractRecord(response, ['dashboard', 'data']) ?? {}
    const memberRecord = record.member && typeof record.member === 'object' ? record.member : null

    return {
      member: memberRecord ? normalizeMember(memberRecord) : null,
      points: normalizePoints(record.points ?? {}).value,
      rewards: record.rewards ? normalizeRewardsSummary(record.rewards) : null,
      orders: extractCollection(record.orders, ['recent_orders']).map(normalizeOrder),
      favorites: extractCollection(record.favorites, ['items']).map(normalizeFavoriteItem),
      pointsHistory: extractCollection(record.points_history, ['history']).map(normalizePointsHistoryEntry),
      raw: record,
    }
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load your dashboard.'))
  }
}

export async function fetchMemberRewards() {
  try {
    const response = await apiFetch('/api/member/rewards', { auth: true })
    return normalizeRewardsSummary(response)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load your rewards summary.'))
  }
}

export async function fetchRewardsProgram() {
  try {
    const response = await apiFetch('/rewards/program')
    return normalizeRewardsProgram(response)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load rewards program details.'))
  }
}

export async function fetchPointsHistory() {
  try {
    const response = await apiFetch('/api/member/points/history', { auth: true })
    return extractCollection(response, ['history', 'data']).map(normalizePointsHistoryEntry)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load your rewards activity.'))
  }
}

export async function fetchRewardsRedemptions() {
  try {
    const response = await apiFetch('/api/member/rewards/redemptions', { auth: true })
    return {
      redemptionTrackingEnabled: Boolean(response?.redemption_tracking_enabled),
      redemptions: extractCollection(response, ['redemptions', 'data']).map(normalizeRewardRedemption),
    }
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load your reward redemptions.'))
  }
}

export async function fetchSessionMemberPoints() {
  try {
    const response = await apiFetch('/api/member/points', { auth: true })
    return normalizePoints(response)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load your Coffee Club points.'))
  }
}

export async function fetchSessionMemberOrders(options = {}) {
  try {
    const params = new URLSearchParams({
      include_items: String(options.includeItems ?? true),
      limit: String(options.limit ?? 50),
      sort_dir: options.sortDir ?? 'desc',
    })

    if (options.sortBy) {
      params.set('sort_by', options.sortBy)
    }

    const response = await apiFetch(`/api/member/orders?${params.toString()}`, { auth: true })
    return extractCollection(response, ['orders', 'data', 'history']).map(normalizeOrder)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load your order history.'))
  }
}

export async function fetchSessionMemberSummary(options = {}) {
  try {
    const params = new URLSearchParams({
      include_items: String(options.includeItems ?? true),
      recent_limit: String(options.recentLimit ?? 6),
      favorites_limit: String(options.favoritesLimit ?? 6),
    })

    if (options.favoritesWindowDays) {
      params.set('favorites_window_days', String(options.favoritesWindowDays))
    }

    const response = await apiFetch(`/api/member/summary?${params.toString()}`, { auth: true })
    return normalizeSummary(response)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load your member summary.'))
  }
}

export async function fetchSessionMemberFavorites(options = {}) {
  try {
    const params = new URLSearchParams({
      limit: String(options.limit ?? 6),
    })

    if (options.windowDays) {
      params.set('window_days', String(options.windowDays))
    }

    if (options.storeId) {
      params.set('store_id', String(options.storeId))
    }

    const response = await apiFetch(`/api/member/favorites?${params.toString()}`, { auth: true })
    return extractCollection(response, ['favorites', 'data']).map(normalizeFavoriteItem)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load your favorite items.'))
  }
}

export async function createFavorite(menuItemId) {
  try {
    const response = await apiFetch('/api/member/favorites', {
      method: 'POST',
      auth: true,
      data: {
        menu_item_id: menuItemId,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return extractRecord(response, ['data', 'result']) ?? response
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not save that favorite right now.'))
  }
}

export async function deleteFavorite(menuItemId) {
  try {
    const response = await apiFetch(`/api/member/favorites/${menuItemId}`, {
      method: 'DELETE',
      auth: true,
    })
    return extractRecord(response, ['data', 'result']) ?? response
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not remove that favorite right now.'))
  }
}

export async function fetchMemberPoints(memberId) {
  try {
    const response = await apiFetch(`/members/${memberId}/points`, { auth: true })
    return normalizePoints(response)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load your Coffee Club points.'))
  }
}

export async function fetchMemberOrders(memberId) {
  try {
    const response = await apiFetch(`/members/${memberId}/orders`, { auth: true })
    return extractCollection(response, ['orders', 'data', 'history']).map(normalizeOrder)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load your order history.'))
  }
}

export async function fetchMemberSummary(memberId) {
  try {
    const response = await apiFetch(
      `/members/${memberId}/summary?include_items=true&recent_limit=6&favorites_limit=6`,
      { auth: true },
    )
    return normalizeSummary(response)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load your member summary.'))
  }
}

export async function fetchMemberFavorites(memberId) {
  try {
    const params = new URLSearchParams({ limit: '6' })
    const response = await apiFetch(`/members/${memberId}/favorites?${params.toString()}`, { auth: true })
    return extractCollection(response, ['favorites', 'data']).map(normalizeFavoriteItem)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load your favorite items.'))
  }
}

export async function fetchOrderDetail(orderId) {
  try {
    const response = await apiFetch(`/api/member/orders/${orderId}`, { auth: true })
    return normalizeOrder(extractRecord(response, ['order', 'data', 'detail']) ?? {})
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load that order right now.'))
  }
}
