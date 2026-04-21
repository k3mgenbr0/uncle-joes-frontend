import { apiFetch, extractRecord, getErrorMessage } from './api'
import { fetchOrderDetail } from './membersService'

function normalizeOrderItem(item) {
  return {
    id: String(item.order_item_id ?? item.id ?? item.menu_item_id ?? item.item_id ?? ''),
    orderId: String(item.order_id ?? ''),
    menuItemId: String(item.menu_item_id ?? item.item_id ?? ''),
    name: item.item_name ?? item.name ?? '',
    size: item.size ?? '',
    quantity: Number(item.quantity ?? 1),
    price: Number(item.price ?? item.unit_price ?? 0),
    unitPrice: Number(item.unit_price ?? item.price ?? 0),
    lineTotal: Number(item.line_total ?? (item.unit_price ?? item.price ?? 0) * (item.quantity ?? 1)),
  }
}

function normalizeOrderPreview(payload) {
  const record = extractRecord(payload, ['preview', 'order', 'data']) ?? payload ?? {}
  const items = Array.isArray(record.items) ? record.items : []

  return {
    id: String(record.order_id ?? record.id ?? ''),
    memberId: String(record.member_id ?? ''),
    storeId: String(record.store_id ?? ''),
    storeName: record.store_name ?? '',
    storeCity: record.store_city ?? '',
    storeState: record.store_state ?? '',
    storePhone: record.store_phone ?? '',
    location: record.location ?? null,
    date: record.order_date ?? '',
    pickupTime: record.pickup_time ?? '',
    readyByEstimate: record.ready_by_estimate ?? '',
    submittedAt: record.submitted_at ?? '',
    orderStatus: record.order_status ?? '',
    estimatedPrepMinutes: record.estimated_prep_minutes ?? null,
    specialInstructions: record.special_instructions ?? '',
    subtotal: Number(record.subtotal ?? 0),
    discount: Number(record.discount ?? 0),
    tax: Number(record.tax ?? 0),
    total: Number(record.total ?? 0),
    pointsEarned: Number(record.points_earned ?? 0),
    pointsRedeemed: Number(record.points_redeemed ?? 0),
    paymentSummary: record.payment_summary ?? null,
    sourceOrderId: record.source_order_id ?? '',
    warnings: Array.isArray(record.warnings) ? record.warnings : [],
    items: items.map(normalizeOrderItem),
    raw: record,
  }
}

export async function createMemberOrder(payload) {
  try {
    const response = await apiFetch('/api/member/orders', {
      method: 'POST',
      auth: true,
      data: payload,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return extractRecord(response, ['order', 'data', 'detail']) ?? response
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not place your pickup order right now.'))
  }
}

export async function previewMemberOrder(payload) {
  try {
    const response = await apiFetch('/api/member/orders/preview', {
      method: 'POST',
      auth: true,
      data: payload,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return normalizeOrderPreview(response)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not preview this pickup order right now.'))
  }
}

export async function previewPickupOrder(payload) {
  return previewMemberOrder(payload)
}

export async function previewReorder(orderId, payload = { payment_method: 'pay_in_store' }) {
  try {
    const response = await apiFetch(`/api/member/orders/${encodeURIComponent(orderId)}/reorder`, {
      method: 'POST',
      auth: true,
      data: payload,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return normalizeOrderPreview(response)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not rebuild that previous order right now.'))
  }
}

export async function createPickupOrder(payload) {
  const created = await createMemberOrder(payload)
  const orderId = created?.order_id ?? created?.id ?? ''

  if (!orderId) {
    return created
  }

  try {
    return await fetchOrderDetail(orderId)
  } catch {
    return created
  }
}
