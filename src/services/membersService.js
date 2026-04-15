import { apiClient, extractCollection, extractRecord, getErrorMessage } from './api'

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
    id: String(item.id ?? item.item_id ?? item.menu_item_id ?? `${item.name ?? item.item_name ?? 'item'}`),
    name: item.name ?? item.item_name ?? 'Menu Item',
    size: item.size ?? item.item_size ?? 'Standard',
    quantity: Number(item.quantity ?? item.qty ?? 1),
    price: Number(item.price ?? item.unit_price ?? 0),
  }
}

function normalizeOrder(order) {
  const items = extractCollection(order.items ?? order.line_items ?? order.order_items ?? [], [])

  return {
    id: String(order.id ?? order.order_id ?? ''),
    date: order.order_date ?? order.date ?? order.created_at ?? '',
    locationName: order.location_name ?? order.store_name ?? '',
    city: order.city ?? '',
    state: order.state ?? '',
    total: Number(order.total ?? order.order_total ?? order.total_amount ?? 0),
    items: items.map(normalizeOrderItem),
    raw: order,
  }
}

export async function fetchMemberPoints(memberId) {
  try {
    const response = await apiClient.get(`/members/${memberId}/points`)
    return normalizePoints(response.data)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load your Coffee Club points.'))
  }
}

export async function fetchMemberOrders(memberId) {
  try {
    const response = await apiClient.get(`/members/${memberId}/orders`)
    return extractCollection(response.data, ['orders', 'data', 'history']).map(normalizeOrder)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load your order history.'))
  }
}
