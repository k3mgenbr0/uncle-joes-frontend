<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import { fetchLocation } from '../services/locationsService'
import { formatDate, formatHoursRange, formatPhone, formatStoreLabel } from '../utils/formatters'

const route = useRoute()
const location = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')

const locationId = computed(() => route.params.locationId)

const services = computed(() => {
  if (!location.value) {
    return []
  }

  const explicitServices = Array.isArray(location.value.services) ? location.value.services : []

  return [
    ...explicitServices.map((label) => ({ label, active: true })),
    { label: 'Wi-Fi', active: Boolean(location.value.wifi) },
    { label: 'Drive-Thru', active: Boolean(location.value.driveThru) },
    { label: 'DoorDash', active: Boolean(location.value.doorDash) },
    { label: 'Pickup', active: Boolean(location.value.pickupSupported) },
    { label: 'Dine-In', active: Boolean(location.value.dineInSupported) },
  ].filter((service) => service.active)
})

const mapUrl = computed(() => {
  if (!location.value?.mapAddress) {
    return ''
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.value.mapAddress)}`
})

const weeklyHours = computed(() => {
  const hours = location.value?.hours

  if (!hours || typeof hours !== 'object') {
    return []
  }

  return Object.entries(hours).map(([day, value]) => ({
    day: `${day.charAt(0).toUpperCase()}${day.slice(1)}`,
    label: formatHoursRange(value?.open, value?.close),
  }))
})

async function loadLocation() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    location.value = await fetchLocation(locationId.value)
  } catch (error) {
    errorMessage.value = error.message
    location.value = null
  } finally {
    isLoading.value = false
  }
}

watch(
  location,
  (currentLocation) => {
    if (currentLocation) {
      document.title = `${currentLocation.city}, ${currentLocation.state} | Uncle Joe's Coffee Company`
    }
  },
  { immediate: false },
)

watch(locationId, loadLocation)
onMounted(loadLocation)
</script>

<template>
  <section class="section">
    <div class="container detail-page">
      <RouterLink class="back-link" :to="{ name: 'locations' }">← Back to locations</RouterLink>

      <LoadingState
        v-if="isLoading"
        title="Loading location details"
        description="Getting the latest store details and hours."
      />

      <ErrorState
        v-else-if="errorMessage"
        title="Location unavailable"
        :message="errorMessage"
        action-label="Try Again"
        @action="loadLocation"
      />

      <div v-else-if="location" class="detail-layout">
        <BaseCard class="detail-hero-card" padding="lg">
          <div class="card-topline">
            <span class="badge">{{ location.state }}</span>
            <span
              class="status-pill"
              :class="{ 'status-pill--open': location.openNow, 'status-pill--closed': location.openNow === false }"
            >
              {{ location.openNow === null ? 'Status unavailable' : location.openNow ? 'Open now' : 'Closed now' }}
            </span>
          </div>

          <h1>{{ formatStoreLabel(location.name, location.city, location.state) }}</h1>
          <p class="detail-lead">{{ location.fullAddress || location.address || 'Address unavailable' }}</p>

          <div class="detail-grid">
            <div>
              <span class="detail-label">Today</span>
              <strong>{{ location.hoursTodayLabel || 'Hours unavailable' }}</strong>
            </div>
            <div>
              <span class="detail-label">Phone</span>
              <strong>{{ formatPhone(location.phone) }}</strong>
            </div>
            <div>
              <span class="detail-label">Email</span>
              <strong>{{ location.email || 'Unavailable' }}</strong>
            </div>
            <div>
              <span class="detail-label">Store ID</span>
              <strong>{{ location.id }}</strong>
            </div>
          </div>

          <div class="service-badges">
            <span v-for="service in services" :key="service.label" class="badge">
              {{ service.label }}
            </span>
          </div>

          <div class="hero-actions">
            <a v-if="mapUrl" :href="mapUrl" target="_blank" rel="noreferrer">
              <BaseButton>Open in Maps</BaseButton>
            </a>
            <a v-if="location.phone" :href="`tel:${location.phone}`">
              <BaseButton variant="secondary">Call Store</BaseButton>
            </a>
          </div>
        </BaseCard>

        <BaseCard padding="lg">
          <p class="eyebrow">Weekly Hours</p>
          <h2>Plan your next coffee stop</h2>

          <div v-if="weeklyHours.length" class="hours-list">
            <div v-for="entry in weeklyHours" :key="entry.day" class="hours-row">
              <span>{{ entry.day }}</span>
              <strong>{{ entry.label }}</strong>
            </div>
          </div>
          <p v-else class="detail-lead">Weekly hours are not available for this store yet.</p>
        </BaseCard>

        <BaseCard padding="lg">
          <p class="eyebrow">Holiday Hours</p>
          <h2>Special schedule updates</h2>
          <div v-if="location.holidayHours.length" class="hours-list">
            <div v-for="entry in location.holidayHours" :key="entry.date" class="hours-row">
              <span>{{ formatDate(entry.date, { month: 'long', day: 'numeric', year: 'numeric' }) }}</span>
              <strong>
                {{
                  entry.open && entry.close
                    ? formatHoursRange(entry.open, entry.close)
                    : entry.note || 'Closed'
                }}
              </strong>
            </div>
          </div>
          <p v-else class="detail-lead">No holiday schedule adjustments are posted right now.</p>
        </BaseCard>
      </div>
    </div>
  </section>
</template>
