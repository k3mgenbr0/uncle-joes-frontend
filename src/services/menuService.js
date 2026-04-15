import { apiClient, extractCollection, extractRecord, getErrorMessage } from './api'

function normalizeMenuItem(item) {
  return {
    id: String(item.id ?? item.item_id ?? item.menu_item_id ?? ''),
    name: item.name ?? item.item_name ?? 'Menu Item',
    category: item.category ?? item.type ?? 'Uncategorized',
    size: item.size ?? item.default_size ?? 'Standard',
    calories: item.calories ?? item.calorie_count ?? null,
    price: Number(item.price ?? item.unit_price ?? 0),
    description: item.description ?? item.details ?? '',
    image: item.image_url ?? item.image ?? '',
    raw: item,
  }
}

export async function fetchMenu() {
  try {
    const response = await apiClient.get('/menu')
    return extractCollection(response.data, ['items', 'menu', 'data']).map(normalizeMenuItem)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load the menu right now.'))
  }
}

export async function fetchMenuItem(itemId) {
  try {
    const response = await apiClient.get(`/menu/${itemId}`)
    return normalizeMenuItem(extractRecord(response.data, ['item', 'data', 'menu_item']) ?? {})
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load that menu item.'))
  }
}
