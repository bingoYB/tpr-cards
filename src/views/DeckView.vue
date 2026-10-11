<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDecks } from '@/composables/useDecks'
import AppHeader from '@/components/AppHeader.vue'
import Icon from '@/components/Icon.vue'
import CardVisual from '@/components/CardVisual.vue'
import { ageLabel, ageGroups } from '@/data/ages'
import { getCardImage } from '@/data/illustrations'

const props = defineProps<{ id: string }>()
const router = useRouter()
const { getDeck, duplicateDeck } = useDecks()

const deck = computed(() => getDeck(props.id))
const downloadUrl = computed(() => deck.value?.builtIn ? `${import.meta.env.BASE_URL}downloads/${deck.value.id}.zip` : undefined)
const illustrated = computed(() => deck.value?.cards.some((c) => !!c.imageId || !!getCardImage(c)))
const ageHint = computed(() => ageGroups.find((age) => age.id === deck.value?.ageGroup)?.hint)

function copyToMine() {
  const id = duplicateDeck(props.id)
  if (id) router.push(`/edit/${id}`)
}
</script>

<template>
  <div v-if="deck" class="page" :style="{ '--deck-color': deck.color }">
    <AppHeader :title="deck.name">
      <template #actions>
        <RouterLink
          v-if="!deck.builtIn"
          :to="`/edit/${deck.id}`"
          class="icon-btn"
          aria-label="编辑卡组"
        >
          <Icon name="edit" />
        </RouterLink>
        <button v-else class="icon-btn" aria-label="复制为我的卡组" @click="copyToMine">
          <Icon name="copy" />
        </button>
      </template>
    </AppHeader>

    <main class="container">
      <div class="deck-hero">
        <span class="deck-hero__emoji">{{ deck.emoji }}</span>
        <p v-if="deck.description" class="deck-hero__desc">{{ deck.description }}</p>
        <p class="deck-hero__count">{{ ageLabel(deck.ageGroup) }} · {{ deck.cards.length }} 张卡片</p>
      </div>

      <p v-if="ageHint" class="deck-age-hint">{{ ageHint }}</p>
      <div class="deck-actions">
        <RouterLink class="btn btn-primary" :to="`/play/${deck.id}`">
          <Icon name="play" /> 顺序开始
        </RouterLink>
        <RouterLink class="btn" :to="`/play/${deck.id}?shuffle=1`">
          <Icon name="shuffle" /> 随机开始
        </RouterLink>
        <a v-if="downloadUrl && illustrated" :href="downloadUrl" download class="btn deck-download"><Icon name="download" /> 下载 {{ deck.cards.length }} 张英文图片卡</a>
      </div>

      <p v-if="illustrated && deck.builtIn" class="deck-age-hint">图片联网查看后可离线浏览，也可下载整组图片保存或打印。</p>

      <section class="section">
        <h2 class="section-title">卡片列表 · 点击任意一张从它开始</h2>
        <div v-if="deck.cards.length" class="card-list" :class="{ 'card-list--illustrated': illustrated }">
          <RouterLink
            v-for="(c, i) in deck.cards"
            :key="c.id"
            :to="`/play/${deck.id}?start=${i}`"
            class="card-row"
          >
            <CardVisual :card="c" :sizes="illustrated ? '(min-width: 760px) 204px, (min-width: 640px) calc((100vw - 148px) / 3), calc((100vw - 104px) / 2)' : '44px'" class="card-row__emoji" />
            <span class="card-row__text">
              <strong>{{ c.en }}</strong>
              <small>{{ c.zh }}</small>
              <small v-if="c.tip" class="card-row__tip">{{ c.tip }}</small>
            </span>
            <span v-if="!c.imageId && !getCardImage(c)" class="card-row__index">{{ i + 1 }}</span>
          </RouterLink>
        </div>
        <p v-else class="empty">
          还没有卡片，<RouterLink :to="`/edit/${deck.id}`">去添加</RouterLink>
        </p>
      </section>
    </main>
  </div>

  <div v-else class="page">
    <AppHeader title="未找到卡组" />
    <main class="container">
      <p class="empty">该卡组不存在或已被删除。</p>
    </main>
  </div>
</template>

<style scoped>
.deck-age-hint { color: var(--muted); font-size: 0.9rem; background: var(--surface); border-radius: 14px; padding: 14px; margin-bottom: 16px; }
.card-list.card-list--illustrated { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.card-list--illustrated .card-row { flex-direction: column; position: relative; padding: 12px; border: 2px solid color-mix(in srgb, var(--deck-color) 40%, var(--surface)); border-radius: 22px; text-align: center; gap: 8px; }
.card-list--illustrated .card-row::after { content: ''; position: absolute; inset: 5px; border: 1px dashed color-mix(in srgb, var(--deck-color) 30%, transparent); border-radius: 16px; pointer-events: none; }
.card-list--illustrated .card-row__emoji { width: 100%; }
.card-list--illustrated .card-row__text { width: 100%; }
.card-list--illustrated .card-row__index { position: absolute; top: 12px; left: 12px; width: 26px; height: 26px; border-radius: 50%; background: var(--deck-color); color: #fff; display: grid; place-items: center; font-weight: 700; }
.card-row__tip { margin-top: 6px; font-size: 0.75rem !important; }
@media (min-width: 640px) { .card-list.card-list--illustrated { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

.deck-hero {
  text-align: center;
  padding: 12px 0 20px;
}

.deck-hero__emoji {
  display: inline-block;
  font-size: 4rem;
  line-height: 1;
  margin-bottom: 10px;
}

.deck-hero__desc {
  color: var(--muted);
  font-size: 0.95rem;
  max-width: 420px;
  margin: 0 auto;
}

.deck-hero__count {
  margin-top: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--deck-color);
}

.deck-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.deck-download { grid-column: 1 / -1; }

.deck-actions .btn-primary {
  background: var(--deck-color);
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  background: var(--surface);
  border-radius: 14px;
  box-shadow: var(--shadow);
  transition: transform 0.1s;
}

.card-row:active {
  transform: scale(0.98);
}

.card-row__emoji {
  font-size: 1.9rem;
  line-height: 1;
  width: 44px;
  text-align: center;
  flex: none;
}

.card-row__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.card-row__text strong {
  font-size: 1.05rem;
}

.card-row__text small {
  color: var(--muted);
  font-size: 0.85rem;
}

.card-row__index {
  font-size: 0.75rem;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
</style>
