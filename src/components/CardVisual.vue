<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TprCard } from '@/types'
import { getCardImage } from '@/data/illustrations'
const props = defineProps<{ card: TprCard }>()
const src = computed(() => {
  const path = getCardImage(props.card)
  return path ? `${import.meta.env.BASE_URL}illustrations/${path}` : undefined
})
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
