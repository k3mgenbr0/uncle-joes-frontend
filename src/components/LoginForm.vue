<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const form = reactive({
  email: '',
  password: 'Coffee123!',
})

const isSubmitting = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await authStore.login({
      email: form.email.trim(),
      password: form.password,
    })

    router.push('/')
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form class="login-form" @submit.prevent="handleSubmit">
    <BaseInput
      v-model="form.email"
      label="Email"
      type="email"
      placeholder="member@example.com"
      autocomplete="email"
      required
    />

    <BaseInput
      v-model="form.password"
      label="Password"
      type="password"
      autocomplete="current-password"
      required
    />

    <p class="helper-text">
      Demo password for Coffee Club users: <strong>Coffee123!</strong>
    </p>
    <p v-if="errorMessage" class="helper-text helper-text--error">{{ errorMessage }}</p>

    <BaseButton type="submit" block :disabled="isSubmitting">
      {{ isSubmitting ? 'Signing In...' : 'Sign In' }}
    </BaseButton>
  </form>
</template>
