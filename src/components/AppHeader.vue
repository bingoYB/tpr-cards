<script setup lang="ts">
import { useBack } from '@/composables/useBack'
import Icon from './Icon.vue'

const props = withDefaults(defineProps<{ title: string; back?: string | false }>(), {
  back: '/',
})

const { back } = useBack()
</script>

<template>
  <header class="app-header">
    <button v-if="props.back !== false" class="icon-btn" aria-label="返回" @click="back(props.back)">
      <Icon name="back" size="28" />
    </button>
    <span v-else />
    <h1 class="app-header__title">{{ title }}</h1>
    <div class="app-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>
