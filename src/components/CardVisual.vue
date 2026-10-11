<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TprCard } from '@/types'
import { getCardImage } from '@/data/illustrations'
import { readCardImage } from '@/storage/cardImages'
const props = defineProps<{ card: TprCard; preview?: string }>()
const uploaded = ref<string>()
const src = computed(() => {
  if (props.preview) return props.preview
  if (props.card.imageId) return uploaded.value
  const path = getCardImage(props.card)
  return path ? `${import.meta.env.BASE_URL}illustrations/${path}` : undefined
})
watch(() => props.card.imageId, async (id, _old, onCleanup) => {
  uploaded.value = undefined
  if (!id) return
  let active = true
  let url: string | undefined
  onCleanup(() => { active = false; if (url) URL.revokeObjectURL(url) })
  try {
    const blob = await readCardImage(id)
    if (active && blob) { url = URL.createObjectURL(blob); uploaded.value = url }
  } catch { /* Keep the emoji fallback when browser storage is unavailable. */ }
}, { immediate: true })
const failed = ref(false)
watch(src, () => { failed.value = false })
</script>

<template>
  <img v-if="src && !failed" :src="src" :alt="card.en" class="card-visual" draggable="false" @error="failed = true" />
  <span v-else class="card-visual card-visual--emoji" aria-hidden="true">{{ card.emoji }}</span>
</template>

<style scoped>
.card-visual { display: block; width: 100%; aspect-ratio: 4 / 5; object-fit: contain; border-radius: 18px; background: #fffcef; }
.card-visual--emoji { display: flex; align-items: center; justify-content: center; background: transparent; font-size: inherit; aspect-ratio: 1; }
</style>
