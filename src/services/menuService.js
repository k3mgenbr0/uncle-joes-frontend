import { apiFetch, extractCollection, extractRecord, getErrorMessage } from './api'

const SIZE_PRIORITY = {
  Small: 1,
  Medium: 2,
  Large: 3,
}

function normalizeMenuItem(item) {
  return {
    id: String(item.id ?? item.item_id ?? item.menu_item_id ?? ''),
    name: item.name ?? item.item_name ?? '',
    category: item.category ?? item.type ?? '',
    size: item.size ?? item.default_size ?? '',
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
          name: related.name ?? related.item_name ?? '',
          category: related.category ?? '',
          size: related.size ?? '',
          price: related.price ?? null,
        }))
      : [],
    raw: item,
  }
}

function sortVariantsBySize(left, right) {
  const leftPriority = SIZE_PRIORITY[left.size] ?? 99
  const rightPriority = SIZE_PRIORITY[right.size] ?? 99

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority
  }

  return (left.size || '').localeCompare(right.size || '')
}

export function groupMenuItems(items = []) {
  const groups = new Map()

  items.forEach((item) => {
    const key = [item.name, item.category].filter(Boolean).join('::').toLowerCase()

    if (!groups.has(key)) {
      groups.set(key, {
        id: item.id,
        name: item.name,
        category: item.category,
        description: item.description,
        image: item.image,
        availabilityStatus: item.availabilityStatus,
        seasonal: item.seasonal,
        tags: item.tags,
        variants: [],
      })
    }

    groups.get(key).variants.push({
      id: item.id,
      size: item.size,
      calories: item.calories,
      price: item.price,
      priceDisplay: item.priceDisplay,
      raw: item,
    })
  })

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      variants: [...group.variants].sort(sortVariantsBySize),
      defaultVariant: [...group.variants].sort(sortVariantsBySize).find((variant) => variant.size === 'Medium')
        ?? [...group.variants].sort(sortVariantsBySize)[0],
    }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

export async function fetchMenu() {
  try {
    const response = await apiFetch('/menu')
    return extractCollection(response, ['items', 'menu', 'data']).map(normalizeMenuItem)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load the menu right now.'))
  }
}

export async function fetchMenuItem(itemId) {
  try {
    const response = await apiFetch(`/menu/${itemId}`)
    return normalizeMenuItem(extractRecord(response, ['item', 'data', 'menu_item']) ?? {})
  } catch (error) {
    throw new Error(getErrorMessage(error, 'We could not load that menu item.'))
  }
}
