<script setup>
import BaseCard from './BaseCard.vue'
import BaseInput from './BaseInput.vue'

const searchTerm = defineModel('searchTerm', {
  type: String,
  default: '',
})

const selectedCategory = defineModel('selectedCategory', {
  type: String,
  default: 'All',
})

defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <BaseCard class="filters-card">
    <div class="filters-grid">
      <BaseInput
        v-model="searchTerm"
        label="Search menu"
        type="search"
        placeholder="Search by item name"
      />

      <label class="input-group">
        <span class="input-label">Category</span>
        <select v-model="selectedCategory" class="base-input base-select">
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </label>
    </div>
  </BaseCard>
</template>
