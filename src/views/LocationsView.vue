<script setup>
import { computed, onMounted, ref } from 'vue'
import LocationCard from '../components/LocationCard.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import EmptyState from '../components/EmptyState.vue'
import BaseInput from '../components/BaseInput.vue'
import { fetchLocations } from '../services/locationsService'

const locations = ref([])
const searchTerm = ref('')
const isLoading = ref(true)
const errorMessage = ref('')

const filteredLocations = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  if (!query) {
    return locations.value
  }

  return locations.value.filter((location) =>
    [location.city, location.state, location.address, location.name]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query)),
  )
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
  <section class="section">
    <div class="container">
      <div class="section-heading">
        <span class="eyebrow">Nearby Stores</span>
        <h1>Locations</h1>
        <p>Search by city or state to find an Uncle Joe's Coffee shop near you.</p>
      </div>

      <BaseInput
        v-model="searchTerm"
        label="Search locations"
        placeholder="Search by city, state, or address"
      />

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
    </div>
  </section>
</template>
