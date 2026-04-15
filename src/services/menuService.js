import { apiClient, extractCollection, extractRecord, getErrorMessage } from './api'

function normalizeMenuItem(item) {
  return {
    id: String(item.id ?? item.item_id ?? item.menu_item_id ?? ''),
    name: item.name ?? item.item_name ?? 'Menu Item',
    category: item.category ?? item.type ?? 'Uncategorized',
    size: item.size ?? item.default_size ?? 'Standard',
    calories: item.calories ?? item.calorie_count ?? null,
    price: Number(item.price ?? item.unit_price ?? 0),
    priceDisplay: item.price_display ?? '',
    description: item.description ?? item.details ?? '',
    image: item.image_url ?? item.image ?? '',
    ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
    allergens: Array.isArray(item.allergens) ? item.allergens : [],
    caffeineMg: item.caffeine_mg ?? null,
    availabilityStatus: item.availability_status ?? '',
    seasonal: item.seasonal ?? null,
    tags: Array.isArray(item.tags) ? item.tags : [],
    customizationOptions: Array.isArray(item.customization_options) ? item.customization_options : [],
    relatedItems: Array.isArray(item.related_items)
      ? item.related_items.map((related) => ({
          id: String(related.item_id ?? related.menu_item_id ?? related.id ?? ''),
          name: related.name ?? related.item_name ?? 'Menu Item',
          category: related.category ?? '',
          size: related.size ?? '',
          price: related.price ?? null,
        }))
      : [],
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
