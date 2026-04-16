import { authenticatedApiClient, extractCollection, extractRecord, getErrorMessage } from './api'
import { normalizeMember } from './authService'

function normalizePoints(payload) {
  const record = extractRecord(payload, ['points', 'data', 'member'])

  return {
    value: Number(
      record?.points ??
        record?.balance ??
        record?.total_points ??
        record?.current_points ??
        0,
    ),
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
    name: item.name ?? item.item_name ?? 'Menu Item',
    size: item.size ?? item.item_size ?? 'Standard',
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
    locationName: order.location_name ?? order.store_name ?? '',
    city: order.city ?? order.store_city ?? '',
    state: order.state ?? order.store_state ?? '',
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
    name: item.item_name ?? item.name ?? 'Favorite Item',
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

export async function fetchMemberPoints(memberId) {
  try {
    const response = await authenticatedApiClient.get(`/members/${memberId}/points`)
    return normalizePoints(response.data)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load your Coffee Club points.'))
  }
}

export async function fetchMemberOrders(memberId) {
  try {
    const response = await authenticatedApiClient.get(`/members/${memberId}/orders`)
    return extractCollection(response.data, ['orders', 'data', 'history']).map(normalizeOrder)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load your order history.'))
  }
}

export async function fetchMemberSummary(memberId) {
  try {
    const response = await authenticatedApiClient.get(`/members/${memberId}/summary`, {
      params: {
        include_items: true,
        recent_limit: 6,
        favorites_limit: 6,
      },
    })
    return normalizeSummary(response.data)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load your member summary.'))
  }
}

export async function fetchMemberFavorites(memberId) {
  try {
    const response = await authenticatedApiClient.get(`/members/${memberId}/favorites`, {
      params: { limit: 6 },
    })
    return extractCollection(response.data, ['favorites', 'data']).map(normalizeFavoriteItem)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load your favorite items.'))
  }
}

export async function fetchOrderDetail(orderId) {
  try {
    const response = await authenticatedApiClient.get(`/orders/${orderId}`)
    return normalizeOrder(extractRecord(response.data, ['order', 'data', 'detail']) ?? {})
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load that order right now.'))
  }
}
