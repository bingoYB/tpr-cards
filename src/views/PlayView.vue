<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  useDocumentVisibility,
  useEventListener,
  useFullscreen,
  usePointerSwipe,
  useWakeLock,
} from '@vueuse/core'
import { useDecks } from '@/composables/useDecks'
import { useSettings } from '@/composables/useSettings'
import { useSpeech } from '@/composables/useSpeech'
import { useBack } from '@/composables/useBack'
import { shuffle as shuffleArray } from '@/utils'
import Icon from '@/components/Icon.vue'
import CardVisual from '@/components/CardVisual.vue'
import { getCardImage } from '@/data/illustrations'

const props = defineProps<{ id: string }>()
const route = useRoute()
const { back } = useBack()
const { getDeck } = useDecks()
const { settings } = useSettings()
const { speak, stop: stopSpeech, speaking, supported: speechSupported } = useSpeech()

const deck = computed(() => getDeck(props.id, route.query.age))
const shuffled = ref(route.query.shuffle === '1')
const startIndex = Number(route.query.start ?? 0) || 0

/** Playback order as indices into deck.cards */
const order = ref<number[]>([])
const pos = ref(0)
const dir = ref<'next' | 'prev'>('next')
const showZh = ref(settings.value.showZh)
const finished = ref(false)
/** Remembers which positions got the "Simon says" prefix so going back is stable */
const simonMemo = new Map<number, boolean>()

function buildOrder(start = 0) {
  const n = deck.value?.cards.length ?? 0
  let idx = Array.from({ length: n }, (_, i) => i)
  if (shuffled.value) {
    idx = shuffleArray(idx)
    // When the user tapped a specific card, keep it first even in random mode
    if (start > 0) {
      const k = idx.indexOf(start)
      if (k > 0) {
        idx.splice(k, 1)
        idx.unshift(start)
      }
    }
    pos.value = 0
  } else {
    pos.value = Math.min(Math.max(start, 0), Math.max(n - 1, 0))
  }
  order.value = idx
  simonMemo.clear()
  finished.value = false
  dir.value = 'next'
}

const total = computed(() => order.value.length)
const card = computed(() => {
  const i = order.value[pos.value]
  return i === undefined ? undefined : deck.value?.cards[i]
})

const isSimon = computed(() => {
  if (!settings.value.simonSays) return false
  if (!simonMemo.has(pos.value)) {
    simonMemo.set(pos.value, Math.random() < settings.value.simonChance)
  }
  return simonMemo.get(pos.value) === true
})

const spokenText = computed(() => {
  if (!card.value) return ''
  return isSimon.value ? `Simon says, ${card.value.en}` : card.value.en
})

function say() {
  if (spokenText.value) speak(spokenText.value)
}

/* ---------- navigation ---------- */

function next() {
  if (pos.value < total.value - 1) {
    dir.value = 'next'
    pos.value++
  } else {
    finish()
  }
}

function prev() {
  if (pos.value > 0) {
    dir.value = 'prev'
    pos.value--
  }
}

function finish() {
  stopSpeech()
  finished.value = true
}

function restart(mode: 'same' | 'shuffle') {
  if (mode === 'shuffle') shuffled.value = true
  buildOrder(0)
}

function exit() {
  back(props.id === 'all' ? '/' : `/deck/${props.id}`)
}

const visibility = useDocumentVisibility()
watch(visibility, (v) => {
  if (v === 'hidden') {
    stopSpeech()
  }
})

/* ---------- gestures & keyboard ---------- */

const stage = ref<HTMLElement | null>(null)
/** Timestamp of the last swipe so the click that follows a mouse-drag doesn't also trigger speech */
let lastSwipeAt = 0
// Pointer events cover touch, mouse and pen alike
usePointerSwipe(stage, {
  threshold: 40,
  onSwipeEnd(_e, direction) {
    if (direction === 'left') next()
    else if (direction === 'right') prev()
    else return
    lastSwipeAt = Date.now()
  },
})

function onStageClick() {
  if (Date.now() - lastSwipeAt < 400) return
  say()
}

useEventListener(window, 'keydown', (e: KeyboardEvent) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement || (e.key === ' ' && e.target instanceof HTMLButtonElement)) return
  switch (e.key) {
    case 'ArrowRight':
    case 'PageDown':
    case 'j':
      e.preventDefault()
      next()
      break
    case 'ArrowLeft':
    case 'PageUp':
    case 'k':
      e.preventDefault()
      prev()
      break
    case ' ':
      e.preventDefault()
      say()
      break
    case 'h':
      showZh.value = !showZh.value
      break
    case 'Escape':
      if (!isFullscreen.value) exit()
      break
  }
})

/* ---------- fullscreen & wake lock ---------- */

const { isSupported: fsSupported, isFullscreen, toggle: toggleFullscreen } = useFullscreen()

const wakeLock = useWakeLock()

buildOrder(startIndex)

onMounted(async () => {
  if (settings.value.keepAwake && wakeLock.isSupported.value) {
    try {
      await wakeLock.request('screen')
    } catch {
      /* ignore: wake lock is best-effort */
    }
  }
})

onBeforeUnmount(() => {
  stopSpeech()
  if (wakeLock.isActive.value) wakeLock.release().catch(() => {})
})

// Speak each new card when auto-speak is on
watch(
  card,
  (c) => {
    if (c && settings.value.autoSpeak && !finished.value) say()
  },
  { immediate: true, flush: 'post' },
)
</script>

<template>
  <div
    v-if="deck && card"
    class="play"
    :class="{ 'play--speaking': speaking }"
    :style="{ '--deck-color': deck.color }"
  >
    <header class="play__top">
      <button class="icon-btn" aria-label="退出" @click="exit">
        <Icon name="close" size="26" />
      </button>
      <div class="play__meta">
        <span class="play__name">{{ deck.name }}</span>
        <span class="play__count">{{ pos + 1 }} / {{ total }}</span>
      </div>
      <div class="play__top-actions">
        <button
          class="icon-btn"
          :class="{ active: showZh }"
          :aria-label="showZh ? '隐藏中文' : '显示中文'"
          @click="showZh = !showZh"
        >
          <Icon :name="showZh ? 'eye' : 'eye-off'" size="24" />
        </button>
        <button
          v-if="fsSupported"
          class="icon-btn"
          :aria-label="isFullscreen ? '退出全屏' : '全屏'"
          @click="toggleFullscreen()"
        >
          <Icon :name="isFullscreen ? 'fullscreen-exit' : 'fullscreen'" size="24" />
        </button>
      </div>
    </header>

    <div class="play__bar">
      <div class="play__bar-fill" :style="{ width: `${((pos + 1) / total) * 100}%` }" />
    </div>

    <main ref="stage" class="play__stage" @click="onStageClick">
      <Transition :name="dir === 'next' ? 'slide-left' : 'slide-right'" mode="out-in">
        <div :key="`${pos}-${order[pos]}`" class="flash">
          <div v-if="isSimon" class="flash__simon">🗣️ Simon says…</div>
          <CardVisual :card="card" class="flash__emoji" :class="{ 'flash__image': !!card.imageId || !!getCardImage(card) }" />
          <div class="flash__text">
            <div class="flash__en">{{ card.en }}</div>
            <div class="flash__zh" :class="{ 'flash__zh--hidden': !showZh }">{{ card.zh }}</div>
            <p v-if="card.tip" class="flash__tip" :class="{ 'flash__zh--hidden': !showZh }">{{ card.tip }}</p>
          </div>
        </div>
      </Transition>
      <p class="play__hint">
        <template v-if="speechSupported">点击卡片朗读 · </template>左右滑动切换
      </p>
    </main>

    <footer class="play__footer">
      <div v-if="speechSupported" class="play__rate">
        <label for="play-rate">语速 <span>{{ settings.rate.toFixed(1) }}×</span></label>
        <input id="play-rate" v-model.number="settings.rate" type="range" min="0.5" max="1.5" step="0.1" />
      </div>
      <div class="play__controls">
      <button class="ctrl" :disabled="pos === 0" aria-label="上一张" @click="prev">
        <Icon name="prev" size="30" />
      </button>
      <button
        v-if="speechSupported"
        class="ctrl ctrl--big"
        :class="{ 'ctrl--on': speaking }"
        aria-label="朗读"
        @click="say"
      >
        <Icon name="speaker" size="34" />
      </button>
      <button class="ctrl" aria-label="下一张" @click="next">
        <Icon name="next" size="30" />
      </button>
      </div>
    </footer>

    <Transition name="fade">
      <div v-if="finished" class="play__done" @click.stop>
        <div class="play__done-card">
          <div class="play__done-emoji">🎉</div>
          <h2>全部完成！</h2>
          <p>{{ total }} 张卡片已练习完毕</p>
          <button class="btn btn-primary btn-block" @click="restart('same')">
            <Icon name="replay" /> 再来一轮
          </button>
          <button class="btn btn-block" @click="restart('shuffle')">
            <Icon name="shuffle" /> 随机再来
          </button>
          <button class="btn btn-block btn-ghost" @click="exit">返回</button>
        </div>
      </div>
    </Transition>
  </div>

  <div v-else class="play play--empty">
    <header class="play__top">
      <button class="icon-btn" aria-label="退出" @click="exit"><Icon name="close" /></button>
    </header>
    <p class="empty">这个卡组还没有卡片。</p>
  </div>
</template>

<style scoped>
.play {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--deck-color, var(--primary)) 14%, var(--bg));
  /* The player never scrolls; let pointer events own every gesture */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  overflow: hidden;
}

.play--empty {
  background: var(--bg);
}

.play__top {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  align-items: center;
  padding: calc(env(safe-area-inset-top, 0px) + 6px) 8px 4px;
}

.play__meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
}

.play__name {
  font-size: 0.8rem;
  color: var(--muted);
  max-width: 50vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.play__count {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.play__top-actions {
  display: flex;
}

.play__bar {
  height: 4px;
  margin: 0 16px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--deck-color) 25%, transparent);
  overflow: hidden;
}

.play__bar-fill {
  height: 100%;
  background: var(--deck-color);
  transition: width 0.25s ease;
}

.play__stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  min-height: 0;
  cursor: pointer;
}

.flash {
  width: 100%;
  max-width: 900px;
  max-height: 100%;
  background: var(--surface);
  border-radius: 28px;
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.12),
    0 0 0 6px color-mix(in srgb, var(--deck-color) 35%, transparent);
  padding: clamp(20px, 5vmin, 48px) clamp(16px, 5vw, 48px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: clamp(8px, 2vmin, 20px);
  position: relative;
  transition: box-shadow 0.2s;
}

.play--speaking .flash {
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.12),
    0 0 0 10px color-mix(in srgb, var(--deck-color) 55%, transparent);
}

.flash__simon {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--deck-color);
  color: #fff;
  font-weight: 700;
  font-size: clamp(0.85rem, 2.5vmin, 1.2rem);
  white-space: nowrap;
}

.flash__image { width: min(44vmin, 320px); flex: none; }
.flash__tip { font-size: clamp(0.75rem, 2vmin, 1rem); color: var(--muted); max-width: 36em; text-wrap: balance; }

.flash__emoji {
  width: auto;
  aspect-ratio: auto;
  font-size: clamp(4.5rem, 24vmin, 12rem);
  line-height: 1.15;
}

.flash__emoji.flash__image { width: min(44vmin, 320px); aspect-ratio: 4 / 5; }

.flash__text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.flash__en {
  font-size: clamp(1.75rem, 7.5vmin, 4.5rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.01em;
  text-wrap: balance;
}

.flash__zh {
  font-size: clamp(1.05rem, 3.6vmin, 2rem);
  color: var(--muted);
  transition: opacity 0.2s;
}

.flash__zh--hidden {
  opacity: 0;
}

@media (orientation: landscape) and (min-width: 640px) {
  .flash__emoji.flash__image { width: min(24vmin, 240px); }

  .flash {
    flex-direction: row;
    gap: clamp(24px, 6vw, 72px);
    padding: clamp(24px, 6vmin, 56px);
  }

.flash__text {
    text-align: left;
    flex: 1;
  }
}

.play__hint {
  margin-top: 14px;
  font-size: 0.8rem;
  color: var(--muted);
  opacity: 0.8;
}

.play__footer { padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 12px); }
.play__rate { display: flex; align-items: center; gap: 16px; max-width: 360px; margin: 0 auto; padding: 0 24px 8px; }
.play__rate label { flex: none; font-size: .8rem; color: var(--muted); }
.play__rate label span { margin-left: 6px; color: var(--text); font-weight: 700; font-variant-numeric: tabular-nums; }
.play__rate input { min-width: 0; flex: 1; accent-color: var(--deck-color); touch-action: auto; }
.play__rate input:focus-visible { outline: 2px solid var(--deck-color); outline-offset: 4px; }
.play__controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 0 16px;
}

.ctrl {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow);
  transition:
    transform 0.1s,
    background 0.2s,
    color 0.2s;
}

.ctrl:active {
  transform: scale(0.92);
}

.ctrl:disabled {
  opacity: 0.35;
}

.ctrl--big {
  width: 76px;
  height: 76px;
  background: var(--deck-color);
  color: #fff;
  box-shadow: 0 8px 20px color-mix(in srgb, var(--deck-color) 45%, transparent);
}

.ctrl--on {
  background: var(--deck-color);
  color: #fff;
}

.ctrl--big.ctrl--on {
  animation: pulse 0.9s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

.play__done {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 5;
}

.play__done-card {
  width: 100%;
  max-width: 360px;
  background: var(--surface);
  border-radius: 24px;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
}

.play__done-emoji {
  font-size: 3.5rem;
  line-height: 1;
}

.play__done-card h2 {
  font-size: 1.4rem;
  font-weight: 800;
}

.play__done-card p {
  color: var(--muted);
  margin-bottom: 10px;
}

.play__done-card .btn-primary {
  background: var(--deck-color);
}

/* card slide transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    transform 0.18s ease,
    opacity 0.18s ease;
}

.slide-left-enter-from {
  transform: translateX(40px);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-40px);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(-40px);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(40px);
  opacity: 0;
}
</style>
