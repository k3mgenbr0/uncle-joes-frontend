<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import LocationCard from '../components/LocationCard.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import EmptyState from '../components/EmptyState.vue'
import BaseInput from '../components/BaseInput.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseCard from '../components/BaseCard.vue'
import { fetchLocations, isStoreOrderable } from '../services/locationsService'

const locations = ref([])
const searchTerm = ref('')
const selectedState = ref('All')
const selectedCity = ref('All')
const selectedAmenity = ref('All')
const selectedOpenNow = ref('All')
const selectedAvailability = ref('All')
const isLoading = ref(true)
const errorMessage = ref('')

const states = computed(() => ['All', ...Array.from(new Set(locations.value.map((location) => location.state).filter(Boolean))).sort()])
const amenities = computed(() => ['All', 'Wi-Fi', 'Drive-Thru', 'DoorDash', 'Pickup', 'Dine-In'])

const cities = computed(() => {
  const pool = selectedState.value === 'All'
    ? locations.value
    : locations.value.filter((location) => location.state === selectedState.value)

  return ['All', ...Array.from(new Set(pool.map((location) => location.city).filter(Boolean))).sort()]
})

const filteredLocations = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  return locations.value.filter((location) =>
    (selectedAvailability.value === 'All'
      || (selectedAvailability.value === 'Open for Ordering' && isStoreOrderable(location))
      || (selectedAvailability.value === 'Coming Soon' && !isStoreOrderable(location))) &&
    (selectedState.value === 'All' || location.state === selectedState.value) &&
    (selectedCity.value === 'All' || location.city === selectedCity.value) &&
    (selectedOpenNow.value === 'All'
      || (selectedOpenNow.value === 'Open Now' && location.openNow === true)
      || (selectedOpenNow.value === 'Closed Now' && location.openNow === false)) &&
    (selectedAmenity.value === 'All'
      || (selectedAmenity.value === 'Wi-Fi' && location.wifi)
      || (selectedAmenity.value === 'Drive-Thru' && location.driveThru)
      || (selectedAmenity.value === 'DoorDash' && location.doorDash)
      || (selectedAmenity.value === 'Pickup' && location.pickupSupported)
      || (selectedAmenity.value === 'Dine-In' && location.dineInSupported)) &&
    (!query ||
      [location.city, location.state, location.region, location.metroArea, location.address, location.name, location.storeName, location.displayName]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query))),
  )
})

function resetFilters() {
  searchTerm.value = ''
  selectedState.value = 'All'
  selectedCity.value = 'All'
  selectedAmenity.value = 'All'
  selectedOpenNow.value = 'All'
  selectedAvailability.value = 'All'
}

watch(selectedState, () => {
  if (selectedCity.value !== 'All' && !cities.value.includes(selectedCity.value)) {
    selectedCity.value = 'All'
  }
})

async function loadLocations() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    locations.value = await fetchLocations()
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}

onMounted(loadLocations)
</script>

<template>
  <section class="section section--catalog">
    <div class="container">
      <div class="section-heading section-heading--wide catalog-heading">
        <div>
          <span class="eyebrow">Nearby Stores</span>
          <h1>Locations</h1>
          <p>Search by city or state to find an Uncle Joe's Coffee shop near you.</p>
        </div>
        <p class="catalog-heading__note">Filter by state, city, amenity, and ordering status to find the right stop for your next coffee run.</p>
      </div>

      <BaseCard class="filters-card" padding="lg">
        <div class="filters-grid filters-grid--four">
          <BaseInput
            v-model="searchTerm"
            label="Search locations"
            type="search"
            placeholder="Search by city, state, or address"
          />

          <label class="input-group">
            <span class="input-label">State</span>
            <select v-model="selectedState" class="base-input base-select">
              <option v-for="state in states" :key="state" :value="state">{{ state }}</option>
            </select>
          </label>

          <label class="input-group">
            <span class="input-label">City</span>
            <select v-model="selectedCity" class="base-input base-select">
              <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
            </select>
          </label>

          <label class="input-group">
            <span class="input-label">Availability</span>
            <select v-model="selectedAvailability" class="base-input base-select">
              <option value="All">All</option>
              <option value="Open for Ordering">Open for Ordering</option>
              <option value="Coming Soon">Coming Soon</option>
            </select>
          </label>

          <label class="input-group">
            <span class="input-label">Open Now</span>
            <select v-model="selectedOpenNow" class="base-input base-select">
              <option value="All">All</option>
              <option value="Open Now">Open Now</option>
              <option value="Closed Now">Closed Now</option>
            </select>
          </label>

          <label class="input-group">
            <span class="input-label">Amenity</span>
            <select v-model="selectedAmenity" class="base-input base-select">
              <option v-for="amenity in amenities" :key="amenity" :value="amenity">{{ amenity }}</option>
            </select>
          </label>
        </div>

        <div class="filters-actions">
          <BaseButton variant="ghost" size="sm" @click="resetFilters">Clear filters</BaseButton>
        </div>
      </BaseCard>

      <LoadingState
        v-if="isLoading"
        title="Loading locations"
        description="Finding stores and hours for you now."
      />

      <ErrorState
        v-else-if="errorMessage"
        title="Locations unavailable"
        :message="errorMessage"
        action-label="Try Again"
        @action="loadLocations"
      />

      <EmptyState
        v-else-if="!filteredLocations.length"
        title="No matching locations"
        description="Try another city or state to widen the search."
      />

      <div v-else class="cards-grid cards-grid--two">
        <LocationCard
          v-for="location in filteredLocations"
          :key="location.id || `${location.city}-${location.address}`"
          :location="location"
        />
      </div>

      <p v-if="filteredLocations.some((location) => !isStoreOrderable(location))" class="helper-text helper-text--compact">
        Stores marked “Coming Soon!” are visible here, but they are not yet available for pickup ordering.
      </p>
    </div>
  </section>
</template>
