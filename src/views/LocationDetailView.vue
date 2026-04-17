<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import { fetchLocation } from '../services/locationsService'
import { dedupeLabels, formatCityStatePostal, formatDate, formatHoursRange, formatPhone, formatServiceLabel, formatStoreLabel } from '../utils/formatters'

const route = useRoute()
const location = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')

const locationId = computed(() => route.params.locationId)
const contactRows = computed(() =>
  [
    location.value?.hoursTodayLabel ? { label: 'Today', value: location.value.hoursTodayLabel } : null,
    location.value?.phone ? { label: 'Phone', value: formatPhone(location.value.phone) } : null,
    location.value?.email ? { label: 'Email', value: location.value.email } : null,
  ].filter(Boolean),
)

const services = computed(() => {
  if (!location.value) {
    return []
  }

  const explicitServices = Array.isArray(location.value.services) ? location.value.services : []

  return dedupeLabels(
    [
      ...explicitServices,
      location.value.wifi ? 'Wi-Fi' : '',
      location.value.driveThru ? 'Drive-Thru' : '',
      location.value.doorDash ? 'DoorDash' : '',
      location.value.pickupSupported ? 'Pickup' : '',
      location.value.dineInSupported ? 'Dine-In' : '',
    ],
    formatServiceLabel,
  )
})

const mapUrl = computed(() => {
  if (!location.value?.mapAddress) {
    return ''
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.value.mapAddress)}`
})

const mapEmbedUrl = computed(() => {
  if (location.value?.latitude !== null && location.value?.latitude !== undefined && location.value?.longitude !== null && location.value?.longitude !== undefined) {
    const latitude = Number(location.value.latitude)
    const longitude = Number(location.value.longitude)
    const delta = 0.01
    return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - delta}%2C${latitude - delta}%2C${longitude + delta}%2C${latitude + delta}&layer=mapnik&marker=${latitude}%2C${longitude}`
  }

  if (location.value?.mapAddress) {
    return `https://www.google.com/maps?q=${encodeURIComponent(location.value.mapAddress)}&output=embed`
  }

  return ''
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

const cityStatePostal = computed(() =>
  formatCityStatePostal(location.value?.city, location.value?.state, location.value?.postalCode),
)

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
            <p v-if="cityStatePostal" class="detail-lead">{{ cityStatePostal }}</p>
          </div>

          <div v-if="contactRows.length" class="detail-grid">
            <div v-for="row in contactRows" :key="row.label" class="detail-grid__item">
              <span class="detail-label">{{ row.label }}</span>
              <strong class="detail-value">{{ row.value }}</strong>
            </div>
          </div>

          <div v-if="services.length" class="service-badges">
            <span v-for="service in services" :key="service" class="badge">
              {{ service }}
            </span>
          </div>
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

        <BaseCard v-if="mapEmbedUrl" padding="lg">
          <p class="eyebrow">Map</p>
          <h2>Find this store</h2>
          <div class="map-frame">
            <iframe
              :src="mapEmbedUrl"
              :title="`Map for ${formatStoreLabel(location.name, location.city, location.state)}`"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <a v-if="mapUrl" class="card-link" :href="mapUrl" target="_blank" rel="noreferrer">
            Open directions
          </a>
        </BaseCard>
      </div>
    </div>
  </section>
</template>
