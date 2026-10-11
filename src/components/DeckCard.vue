<script setup lang="ts">
import type { TprDeck } from '@/types'
import Icon from './Icon.vue'
import { ageLabel } from '@/data/ages'

defineProps<{ deck: TprDeck }>()
</script>

<template>
  <div class="deck" :style="{ '--deck-color': deck.color }">
    <RouterLink :to="`/deck/${deck.id}`" class="deck__main">
      <span class="deck__emoji">{{ deck.emoji }}</span>
      <span class="deck__name">{{ deck.name }}</span>
      <span class="deck__count">{{ ageLabel(deck.ageGroup) }} · {{ deck.cards.length }} 张卡片</span>
    </RouterLink>
    <RouterLink :to="`/play/${deck.id}`" class="deck__play" :aria-label="`开始 ${deck.name}`">
      <Icon name="play" size="22" />
    </RouterLink>
  </div>
</template>

<style scoped>
.deck {
  position: relative;
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  transition: transform 0.1s;
}

.deck:active {
  transform: scale(0.97);
}

.deck::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 6px;
  background: var(--deck-color);
}

.deck__main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 18px 14px 14px;
  min-height: 132px;
}

.deck__emoji {
  font-size: 2.25rem;
  line-height: 1;
  margin-bottom: 6px;
}

.deck__name {
  font-weight: 700;
  font-size: 1.05rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 40px;
}

.deck__count {
  font-size: 0.8rem;
  color: var(--muted);
}

.deck__play {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--deck-color);
  color: #fff;
  box-shadow: 0 3px 8px color-mix(in srgb, var(--deck-color) 45%, transparent);
}
</style>
