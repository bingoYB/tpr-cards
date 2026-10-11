<script setup lang="ts">
import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { ageGroups, isAgeGroup } from '@/data/ages'
import { useDecks } from '@/composables/useDecks'
import { useInstallPrompt } from '@/composables/useInstallPrompt'
import DeckCard from '@/components/DeckCard.vue'
import Icon from '@/components/Icon.vue'

const { builtInDecks, customDecks } = useDecks()
const { canInstall, install } = useInstallPrompt()
const selectedAge = useLocalStorage('tpr.ageGroup', '1')
const currentAge = computed(() => ageGroups.find((age) => age.id === selectedAge.value))
const visibleBuiltIn = computed(() => builtInDecks.filter((deck) => !isAgeGroup(selectedAge.value) || deck.ageGroup === selectedAge.value))
const visibleCustom = computed(() => customDecks.value.filter((deck) => !isAgeGroup(selectedAge.value) || deck.ageGroup === selectedAge.value))
const visibleCount = computed(() => [...visibleBuiltIn.value, ...visibleCustom.value].reduce((n, d) => n + d.cards.length, 0))
const randomLink = computed(() => isAgeGroup(selectedAge.value) ? `/play/all?shuffle=1&age=${selectedAge.value}` : '/play/all?shuffle=1')
</script>

<template>
  <div class="page">
    <header class="home-header">
      <div class="container home-header__inner">
        <div>
          <h1 class="home-title">TPR 指令卡</h1>
          <p class="home-sub">Total Physical Response · 全身反应教学法</p>
        </div>
        <RouterLink to="/settings" class="icon-btn" aria-label="设置">
          <Icon name="settings" size="26" />
        </RouterLink>
      </div>
    </header>

    <main class="container">
      <section class="age-picker" aria-label="按年龄段选择卡片">
        <p class="section-title">从宝宝现在的阶段开始</p>
        <div class="age-tabs">
          <button v-for="age in ageGroups" :key="age.id" :aria-pressed="selectedAge === age.id" :class="{ selected: selectedAge === age.id }" @click="selectedAge = age.id">{{ age.label }}</button>
          <button :aria-pressed="selectedAge === 'all'" :class="{ selected: selectedAge === 'all' }" @click="selectedAge = 'all'">全部</button>
        </div>
        <div v-if="currentAge" class="age-note">
          <strong>{{ currentAge.label }} · {{ currentAge.range }}</strong>
          <p>{{ currentAge.hint }}</p>
          <small>年龄仅作活动难度参考，以孩子的兴趣和能力为准。</small>
        </div>
      </section>
      <RouterLink :to="randomLink" class="hero" :class="{ 'hero--disabled': !visibleCount }" :aria-disabled="!visibleCount" @click="!visibleCount && $event.preventDefault()">
        <span class="hero__emoji">🎲</span>
        <span class="hero__text">
          <strong>{{ currentAge ? `${currentAge.label}随机玩` : '全部随机' }}</strong>
          <small>{{ currentAge ? '当前年龄段' : '混合所有卡组' }} · {{ visibleCount }} 张卡片</small>
        </span>
        <span class="hero__play"><Icon name="play" size="26" /></span>
      </RouterLink>

      <button v-if="canInstall" class="btn btn-block install" @click="install">
        <Icon name="download" /> 安装到主屏幕，离线也能用
      </button>

      <section class="section">
        <h2 class="section-title">内置卡组</h2>
        <div class="grid">
          <DeckCard v-for="d in visibleBuiltIn" :key="d.id" :deck="d" />
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">我的卡组</h2>
        <div class="grid">
          <DeckCard v-for="d in visibleCustom" :key="d.id" :deck="d" />
          <RouterLink to="/edit/new" class="deck-new">
            <Icon name="plus" size="30" />
            <span>新建卡组</span>
          </RouterLink>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.age-picker { margin: 12px 0 20px; }
.age-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
.age-tabs button { padding: 10px 16px; min-height: 44px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); font-weight: 700; }
.age-tabs button.selected { background: var(--primary); border-color: var(--primary); color: #fff; }
.age-note { margin-top: 14px; padding: 16px; background: var(--surface); border-radius: 16px; border-left: 4px solid #a58acb; }
.age-note strong { font-size: 0.95rem; }
.age-note p { margin: 6px 0; color: var(--muted); font-size: 0.9rem; }
.age-note small { color: var(--muted); font-size: 0.75rem; }
.hero--disabled { opacity: 0.5; }

.home-header {
  padding-top: calc(env(safe-area-inset-top, 0px) + 20px);
  padding-bottom: 12px;
}

.home-header__inner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.home-title {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.home-sub {
  color: var(--muted);
  font-size: 0.85rem;
  margin-top: 2px;
}

.hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(135deg, #ff9a5a, #ff4d6d);
  color: #fff;
  box-shadow: 0 8px 24px rgba(255, 90, 90, 0.3);
  transition: transform 0.1s;
}

.hero:active {
  transform: scale(0.98);
}

.hero__emoji {
  font-size: 2.5rem;
  line-height: 1;
}

.hero__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hero__text strong {
  font-size: 1.2rem;
  font-weight: 800;
}

.hero__text small {
  opacity: 0.9;
  font-size: 0.85rem;
}

.hero__play {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.install {
  margin-top: 14px;
}

.deck-new {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 132px;
  border-radius: var(--radius);
  border: 2px dashed var(--border);
  color: var(--muted);
  font-weight: 600;
  transition: transform 0.1s;
}

.deck-new:active {
  transform: scale(0.97);
}
</style>
