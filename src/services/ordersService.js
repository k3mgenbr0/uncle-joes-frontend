import { apiFetch, extractRecord, getErrorMessage } from './api'
import { fetchOrderDetail } from './membersService'

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
