<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TprCard } from '@/types'
import { responsiveImages } from '@/data/responsiveImages'
import { readCardImage } from '@/storage/cardImages'
import { resizeUploadedImage } from '@/storage/imageVariants'
const props = withDefaults(defineProps<{ card: TprCard; preview?: string; sizes?: string; thumbnail?: boolean }>(), {
  sizes: '320px', thumbnail: false,
})
const uploaded = ref<Record<number, string>>({})
const variants = computed(() => {
  if (props.preview || props.card.imageId) return uploaded.value
  if (!Object.hasOwn(responsiveImages, props.card.en)) return {}
  return Object.fromEntries(Object.entries(responsiveImages[props.card.en]!).map(([width, path]) =>
    [width, `${import.meta.env.BASE_URL}illustrations/${path}`],
  ))
})
const src = computed(() => variants.value[props.thumbnail ? 160 : 320] ?? Object.values(variants.value)[0])
const srcset = computed(() => Object.entries(variants.value).map(([width, url]) => `${url} ${width}w`).join(', '))
watch(() => [props.card.imageId, props.preview] as const, async ([id, preview], _old, onCleanup) => {
  uploaded.value = {}
  if (!id && !preview) return
  let active = true
  const urls: string[] = []
  onCleanup(() => { active = false; urls.forEach((url) => URL.revokeObjectURL(url)) })
  try {
    const blob = preview ? await (await fetch(preview)).blob() : await readCardImage(id!)
    if (!blob || !active) return
    const resized = await resizeUploadedImage(blob)
    if (!active) return
    uploaded.value = Object.fromEntries([...resized].map(([width, image]) => {
      const url = URL.createObjectURL(image)
      urls.push(url)
      return [width, url]
    }))
  } catch { /* Keep the emoji fallback when browser storage is unavailable. */ }
}, { immediate: true })
const failed = ref(false)
watch(src, () => { failed.value = false })
</script>

<template>
  <img v-if="src && !failed" :src="src" :srcset="srcset" :sizes="sizes" :alt="card.en" class="card-visual" draggable="false" @error="failed = true" />
  <span v-else class="card-visual card-visual--emoji" aria-hidden="true">{{ card.emoji }}</span>
</template>

<style scoped>
.card-visual { display: block; width: 100%; aspect-ratio: 4 / 5; object-fit: contain; border-radius: 18px; background: #fffcef; }
.card-visual--emoji { display: flex; align-items: center; justify-content: center; background: transparent; font-size: inherit; aspect-ratio: 1; }
</style>
