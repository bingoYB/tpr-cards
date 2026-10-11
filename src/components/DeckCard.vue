<script setup lang="ts">
import type { TprDeck } from '@/types'
import Icon from './Icon.vue'
import CardVisual from './CardVisual.vue'
import { ageLabel } from '@/data/ages'

defineProps<{ deck: TprDeck }>()
</script>

<template>
  <div class="deck" :style="{ '--deck-color': deck.color }">
    <RouterLink :to="`/deck/${deck.id}`" class="deck__main">
      <span class="deck__cover" aria-hidden="true"><CardVisual v-if="deck.cards[0]" :card="deck.cards[0]" thumbnail sizes="(max-width: 700px) 80px, 90px" /><span v-else class="deck__emoji">{{ deck.emoji }}</span></span>
      <span class="deck__content"><span class="deck__category">{{ deck.emoji }} {{ ageLabel(deck.ageGroup) }} · {{ deck.cards.length }} 张卡片</span><span class="deck__name">{{ deck.name }}</span><span v-if="deck.description" class="deck__description">{{ deck.description }}</span><span class="deck__browse">翻开卡组 <span aria-hidden="true">↗</span></span></span>
    </RouterLink>
    <RouterLink :to="`/play/${deck.id}`" class="deck__play" :aria-label="`开始 ${deck.name}`"><Icon name="play" size="18" /></RouterLink>
  </div>
</template>

<style scoped>
.deck { position: relative; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; transition: transform .2s, box-shadow .2s; }
.deck__main { display: flex; gap: 20px; padding: 22px; min-height: 185px; align-items: center; }
.deck__cover { display: grid; place-items: center; flex: none; width: 98px; min-height: 127px; border-radius: 12px; padding: 4px; background: color-mix(in srgb, var(--deck-color) 12%, var(--surface)); transform: rotate(-4deg); }
.deck__cover :deep(.card-visual) { width: 90px; }.deck__emoji { font-size: 2.8rem; }
.deck__content { min-width: 0; display: flex; flex: 1; flex-direction: column; gap: 8px; padding: 2px 0; }
.deck__category { color: var(--muted); font-size: .69rem; }.deck__name { font-weight: 750; font-size: 1.06rem; line-height: 1.45; overflow-wrap: anywhere; padding-right: 8px; }
.deck__description { font-size: .72rem; line-height: 1.7; color: var(--muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.deck__browse { color: var(--muted); font-size: .7rem; margin-top: 6px; padding-right: 42px; }.deck__browse span { margin-left: 5px; }
.deck__play { position: absolute; right: 18px; bottom: 17px; width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: color-mix(in srgb, var(--deck-color) 16%, var(--surface)); color: var(--text); border: 1px solid color-mix(in srgb, var(--deck-color) 25%, var(--border)); transition: background .2s; }
.deck a:focus-visible { outline: 3px solid var(--primary); outline-offset: -4px; }
@media (hover: hover) { .deck:hover { transform: translateY(-3px); box-shadow: 0 10px 24px #4630190c; }.deck__play:hover { background: color-mix(in srgb, var(--deck-color) 30%, var(--surface)); } }
@media (max-width: 700px) { .deck__main { min-height: 166px; padding: 18px; gap: 18px; }.deck__cover { width: 88px; min-height: 115px; }.deck__cover :deep(.card-visual) { width: 80px; }.deck__name { font-size: 1.02rem; } }
</style>
