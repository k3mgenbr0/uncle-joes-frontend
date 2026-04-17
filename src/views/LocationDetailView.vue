<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
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
          <div class="detail-stack">
            <p v-if="location.address" class="detail-lead">{{ location.address }}</p>
            <p v-if="location.addressLineTwo" class="detail-lead">{{ location.addressLineTwo }}</p>
            <p v-if="location.city || location.state || location.postalCode" class="detail-lead">
              {{ [location.city, location.state, location.postalCode].filter(Boolean).join(', ') }}
            </p>
          </div>

          <div v-if="location.hoursTodayLabel || location.phone || location.email" class="detail-grid">
            <div v-if="location.hoursTodayLabel">
              <span class="detail-label">Today</span>
              <strong>{{ location.hoursTodayLabel }}</strong>
            </div>
            <div v-if="location.phone">
              <span class="detail-label">Phone</span>
              <strong>{{ formatPhone(location.phone) }}</strong>
            </div>
            <div v-if="location.email">
              <span class="detail-label">Email</span>
              <strong>{{ location.email }}</strong>
            </div>
          </div>

          <div v-if="services.length" class="service-badges">
            <span v-for="service in services" :key="service.label" class="badge">
              {{ service.label }}
            </span>
          </div>

          <p v-if="location.nearBy" class="detail-lead">{{ location.nearBy }}</p>
        </BaseCard>

        <BaseCard v-if="weeklyHours.length" padding="lg">
          <p class="eyebrow">Weekly Hours</p>
          <h2>Plan your next coffee stop</h2>

          <div class="hours-list">
            <div v-for="entry in weeklyHours" :key="entry.day" class="hours-row">
              <span>{{ entry.day }}</span>
              <strong>{{ entry.label }}</strong>
            </div>
          </div>
        </BaseCard>

        <BaseCard v-if="location.holidayHours.length" padding="lg">
          <p class="eyebrow">Holiday Hours</p>
          <h2>Special schedule updates</h2>
          <div class="hours-list">
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
        </BaseCard>
      </div>
    </div>
  </section>
</template>
