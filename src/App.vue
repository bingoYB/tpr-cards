<script setup lang="ts">
import { watchEffect } from 'vue'
import { usePreferredDark } from '@vueuse/core'
import { useSettings } from '@/composables/useSettings'
import ReloadPrompt from '@/components/ReloadPrompt.vue'

const { settings } = useSettings()
const prefersDark = usePreferredDark()

// Apply the chosen theme to <html> and keep the browser chrome color in sync.
watchEffect(() => {
  const theme = settings.value.theme
  const root = document.documentElement
  if (theme === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)

  const dark = theme === 'dark' || (theme === 'auto' && prefersDark.value)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? '#171311' : '#ff7a45')
})
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="fade" mode="out-in">
      <!-- Keyed on the full path so /play/x?start=3 → /play/x?start=7 re-initialises the player -->
      <component :is="Component" :key="route.fullPath" />
    </Transition>
  </RouterView>
  <ReloadPrompt />
</template>
