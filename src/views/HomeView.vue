<script setup lang="ts">
import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { ageGroups, isAgeGroup } from '@/data/ages'
import { useDecks } from '@/composables/useDecks'
import { useInstallPrompt } from '@/composables/useInstallPrompt'
import DeckCard from '@/components/DeckCard.vue'
import CardVisual from '@/components/CardVisual.vue'
import Icon from '@/components/Icon.vue'

const { builtInDecks, customDecks } = useDecks()
const { canInstall, install } = useInstallPrompt()
const selectedAge = useLocalStorage('tpr.ageGroup', '1')
const currentAge = computed(() => ageGroups.find((age) => age.id === selectedAge.value))
const visibleBuiltIn = computed(() => builtInDecks.filter((deck) => !isAgeGroup(selectedAge.value) || deck.ageGroup === selectedAge.value))
const visibleCustom = computed(() => customDecks.value.filter((deck) => !isAgeGroup(selectedAge.value) || deck.ageGroup === selectedAge.value))
const visibleCount = computed(() => [...visibleBuiltIn.value, ...visibleCustom.value].reduce((n, d) => n + d.cards.length, 0))
const randomLink = computed(() => isAgeGroup(selectedAge.value) ? `/play/all?shuffle=1&age=${selectedAge.value}` : '/play/all?shuffle=1')
const stageLabels = ['亲子初体验', '生活与玩具', '模仿与发现', '听指令挑战']
const previewDeckIds: Record<string, string> = { '1': 'baby-first', '2': 'toddler-play', '3': 'preschool-play', '4-6': 'kids-challenge' }
const previewCards = computed(() => builtInDecks.find((d) => d.id === (previewDeckIds[selectedAge.value] ?? 'baby-first'))?.cards.slice(0, 3) ?? [])
</script>

<template>
  <div class="page home-page">
    <header class="home-header home-container">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true"><Icon name="play" size="19" /></span>
        <div><span class="brand-name">TPR 指令卡</span><span class="brand-caption">听一听 · 动一动 · 一起玩</span></div>
      </div>
      <RouterLink to="/settings" class="home-settings" aria-label="设置"><Icon name="settings" size="21" /></RouterLink>
    </header>

    <main class="home-container">
      <section class="welcome" aria-labelledby="welcome-title">
        <div class="welcome-copy">
          <p class="eyebrow"><span></span> LITTLE MOVES, BIG SMILES</p>
          <h1 id="welcome-title">把英语，<br />玩进日常里<span class="title-dot">。</span></h1>
          <p class="welcome-description">从一个小动作开始，<br class="mobile-break" />和孩子一起听、一起做、一起笑。</p>
          <RouterLink :to="randomLink" class="start-play" :class="{ 'start-play--disabled': !visibleCount }" :aria-disabled="!visibleCount" @click="!visibleCount && $event.preventDefault()">
            <Icon name="play" size="18" /><span>{{ currentAge ? `开始玩 · ${currentAge.label}` : '开始随机玩' }}</span><span class="start-arrow" aria-hidden="true">↗</span>
          </RouterLink>
          <p class="welcome-footnote">{{ currentAge ? '当前年龄段' : '所有卡组' }} · {{ visibleCount }} 张卡片 · 随机播放</p>
        </div>
        <div class="welcome-art" aria-hidden="true">
          <span class="art-spark art-spark--one">✦</span><span class="art-spark art-spark--two">✧</span>
          <div class="art-circle"></div>
          <div v-for="(card, i) in previewCards" :key="card.id" class="preview-card" :class="`preview-card--${i}`"><CardVisual :card="card" /></div>
          <span class="art-note">小小动作，大大快乐</span>
        </div>
      </section>

      <section class="age-picker" aria-labelledby="age-title">
        <div class="section-heading"><h2 id="age-title">从孩子的阶段开始</h2><span class="section-aside">慢慢来，每一步都算数</span></div>
        <div class="age-tabs" aria-label="按年龄段选择卡片">
          <button v-for="(age, i) in ageGroups" :key="age.id" :aria-pressed="selectedAge === age.id" :class="{ selected: selectedAge === age.id }" @click="selectedAge = age.id"><span class="age-label">{{ age.label }}</span><span class="age-stage">{{ stageLabels[i] }}</span></button>
          <button :aria-pressed="selectedAge === 'all'" :class="{ selected: selectedAge === 'all' }" @click="selectedAge = 'all'"><span class="age-label">全部</span><span class="age-stage">自由探索</span></button>
        </div>
        <div v-if="currentAge" class="age-note"><span class="age-note-icon" aria-hidden="true">✿</span><div><strong>{{ currentAge.label }} · {{ currentAge.range }}</strong><p>{{ currentAge.hint }}</p></div></div>
        <p class="age-disclaimer">年龄仅作活动难度参考，以孩子的兴趣和能力为准。</p>
      </section>

      <button v-if="canInstall" class="install" @click="install"><Icon name="download" size="18" /><span>添加到主屏幕，随时打开一起玩</span><span aria-hidden="true">＋</span></button>

      <section class="collection" aria-labelledby="built-in-title">
        <div class="section-heading"><div class="section-heading-title"><span class="section-kicker">THE CARD COLLECTION</span><h2 id="built-in-title">{{ currentAge ? `${currentAge.label}的卡片小世界` : '探索所有卡组' }}</h2></div><span class="collection-count">{{ visibleBuiltIn.length }} 个卡组</span></div>
        <div class="deck-grid"><DeckCard v-for="d in visibleBuiltIn" :key="d.id" :deck="d" /></div>
      </section>

      <section class="collection my-collection" aria-labelledby="custom-title">
        <div class="section-heading"><div><h2 id="custom-title">我的卡组</h2><p class="section-description">把熟悉的生活，变成你们的小小英语游戏。</p></div><span v-if="visibleCustom.length" class="collection-count">{{ visibleCustom.length }} 个卡组</span></div>
        <div class="deck-grid"><DeckCard v-for="d in visibleCustom" :key="d.id" :deck="d" /><RouterLink to="/edit/new" class="deck-new"><span class="new-icon"><Icon name="plus" size="24" /></span><span><strong>创建自己的卡组</strong><small>记录孩子喜欢的动作与游戏</small></span><span class="new-arrow" aria-hidden="true">↗</span></RouterLink></div>
      </section>
      <footer class="home-footer"><span aria-hidden="true">✦</span> 陪伴，是最好的开始 <span class="footer-en">Total Physical Response</span></footer>
    </main>
  </div>
</template>

<style scoped>
.home-page { --home-green: #356452; --home-green-soft: #eaf0e6; --home-peach: #f2dec8; --home-paper: #fbf7ee; background: var(--home-paper); color: var(--text); overflow-x: clip; }
.home-container { width: 100%; max-width: 1040px; margin: 0 auto; padding: 0 32px; }
.home-header { display: flex; align-items: center; justify-content: space-between; padding-top: calc(env(safe-area-inset-top, 0px) + 28px); padding-bottom: 20px; }
.brand { display: flex; gap: 12px; align-items: center; }
.brand-mark { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 15px 15px 15px 5px; background: var(--home-green); color: var(--home-paper); transform: rotate(-6deg); }
.brand-name { font-size: 1.08rem; font-weight: 800; display: block; letter-spacing: .03em; }
.brand-caption { display: block; font-size: .69rem; margin-top: 3px; color: var(--muted); letter-spacing: .08em; }
.home-settings { width: 44px; height: 44px; border: 1px solid var(--border); border-radius: 50%; display: grid; place-items: center; color: var(--muted); background: var(--surface); }
.welcome { position: relative; display: grid; grid-template-columns: 1.1fr 1fr; align-items: center; padding: 36px 0 44px; gap: 32px; }
.eyebrow { font-size: .65rem; font-weight: 700; letter-spacing: .16em; color: var(--home-green); display: flex; align-items: center; gap: 8px; }
.eyebrow span { width: 7px; height: 7px; background: #ca8259; border-radius: 50%; }
h1 { font-family: 'Songti SC', 'STSong', 'Noto Serif CJK SC', serif; font-size: clamp(2.4rem, 4.6vw, 3.65rem); line-height: 1.3; letter-spacing: .035em; margin: 16px 0; font-weight: 700; }
.title-dot { color: #bd7550; }
.welcome-description { font-size: .94rem; line-height: 1.85; color: var(--muted); }
.mobile-break { display: none; }
.start-play { display: inline-flex; align-items: center; gap: 10px; margin-top: 24px; padding: 15px 19px; border-radius: 14px; background: var(--home-green); color: var(--home-paper); font-size: .94rem; font-weight: 700; box-shadow: 0 5px 0 color-mix(in srgb, var(--home-green) 16%, transparent); transition: transform .2s, box-shadow .2s; }
.start-arrow { margin-left: 16px; font-size: 1.3rem; font-weight: 400; }
.start-play--disabled { opacity: .5; }
.welcome-footnote { margin-top: 13px; color: var(--muted); font-size: .72rem; }
.welcome-art { height: 340px; position: relative; }
.art-circle { position: absolute; width: 320px; height: 290px; top: 24px; left: 50%; transform: translateX(-50%) rotate(-12deg); background: var(--home-peach); border-radius: 46% 54% 58% 42%; }
.preview-card { position: absolute; top: 44px; width: 157px; border-radius: 17px; background: #fffdf7; padding: 5px; box-shadow: 0 14px 24px #4c392021; }
.preview-card :deep(.card-visual) { width: 100%; }
.preview-card--0 { left: 5%; transform: rotate(-15deg); top: 57px; }
.preview-card--1 { right: 2%; transform: rotate(15deg); top: 37px; }
.preview-card--2 { left: 50%; transform: translateX(-50%) rotate(-3deg); top: 65px; }
.art-spark { position: absolute; z-index: 2; color: #bb784c; font-size: 35px; }
.art-spark--one { top: 0; right: 20%; }.art-spark--two { bottom: 15px; left: 7%; font-size: 27px; color: var(--home-green); }
.art-note { position: absolute; right: 2%; bottom: 6px; font-size: .8rem; letter-spacing: .09em; transform: rotate(-7deg); color: var(--home-green); border-bottom: 1px dashed currentColor; padding-bottom: 5px; }
.age-picker { padding-top: 25px; border-top: 1px solid var(--border); }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.section-heading h2 { font-size: 1.15rem; font-weight: 750; letter-spacing: .02em; }
.section-aside { color: var(--muted); font-size: .76rem; }
.age-tabs { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
.age-tabs button { text-align: left; padding: 16px 18px; min-height: 77px; border: 1px solid var(--border); border-radius: 16px; background: var(--surface); transition: background .2s, border-color .2s, transform .2s; }
.age-label { display: block; white-space: nowrap; font-size: 1.12rem; font-weight: 800; }.age-stage { display: block; font-size: .72rem; margin-top: 5px; color: var(--muted); }
.age-tabs button.selected { border-color: var(--home-green); background: var(--home-green-soft); color: var(--home-green); box-shadow: inset 0 0 0 1px var(--home-green); }.selected .age-stage { color: var(--home-green); }
.age-note { display: flex; align-items: flex-start; gap: 12px; margin-top: 15px; padding: 17px 20px; background: color-mix(in srgb, var(--home-green-soft) 60%, var(--home-paper)); border-radius: 14px; }
.age-note-icon { color: var(--home-green); font-size: 23px; line-height: 1.2; }.age-note strong { font-size: .8rem; color: var(--home-green); }.age-note p { color: var(--muted); font-size: .8rem; line-height: 1.8; margin-top: 5px; }.age-disclaimer { margin-top: 10px; font-size: .67rem; color: var(--muted); padding-left: 4px; }
.collection { margin-top: 36px; }.section-kicker { display: block; color: var(--muted); font-size: .6rem; letter-spacing: .16em; margin-bottom: 7px; }.collection-count { font-size: .74rem; color: var(--muted); white-space: nowrap; border: 1px solid var(--border); padding: 5px 11px; border-radius: 999px; }
.deck-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }.section-description { color: var(--muted); font-size: .78rem; margin-top: 7px; }
.deck-new { display: flex; align-items: center; gap: 14px; padding: 24px; border: 1px dashed color-mix(in srgb, var(--home-green) 40%, var(--border)); border-radius: 20px; min-height: 126px; color: var(--home-green); transition: background .2s; }.new-icon { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 50%; background: var(--home-green-soft); flex: none; }.deck-new strong { display: block; font-size: .94rem; }.deck-new small { display: block; font-size: .72rem; margin-top: 6px; color: var(--muted); }.new-arrow { margin-left: auto; font-size: 1.3rem; }
.install { width: 100%; display: flex; align-items: center; gap: 10px; margin-top: 20px; padding: 14px 18px; border: 1px solid var(--border); border-radius: 12px; font-size: .8rem; color: var(--home-green); }.install span:last-child { margin-left: auto; }
.home-footer { margin-top: 42px; padding: 22px 0 4px; border-top: 1px solid var(--border); font-size: .72rem; color: var(--muted); }.home-footer > span:first-child { color: #bd7550; margin-right: 8px; }.footer-en { float: right; font-size: .65rem; letter-spacing: .04em; }
.home-page :is(a, button):focus-visible { outline: 3px solid #ba7950; outline-offset: 4px; }
@media (hover: hover) { .start-play:hover { transform: translateY(-2px); box-shadow: 0 7px 0 color-mix(in srgb, var(--home-green) 16%, transparent); }.age-tabs button:hover { transform: translateY(-2px); }.deck-new:hover { background: var(--home-green-soft); }.home-settings:hover { color: var(--home-green); } }
:global(:root[data-theme='dark'] .home-page) { --home-paper: #1c201c; --home-green: #a6c5a5; --home-green-soft: #2b382e; --home-peach: #44382c; }
@media (prefers-color-scheme: dark) { :global(:root:not([data-theme='light']) .home-page) { --home-paper: #1c201c; --home-green: #a6c5a5; --home-green-soft: #2b382e; --home-peach: #44382c; } }
@media (max-width: 700px) { .home-container { padding: 0 22px; }.home-header { padding-top: calc(env(safe-area-inset-top, 0px) + 20px); padding-bottom: 12px; }.welcome { padding: 24px 0 30px; gap: 8px; grid-template-columns: 1.05fr .95fr; }h1 { font-size: 1.8rem; letter-spacing: .01em; }.eyebrow { font-size: .53rem; letter-spacing: .07em; }.welcome-description { font-size: .82rem; }.mobile-break { display: block; }.welcome-art { height: 258px; }.art-circle { width: 200px; height: 220px; top: 17px; }.preview-card { width: 108px; top: 40px; border-radius: 12px; padding: 3px; }.preview-card--0 { left: -5%; top: 65px; }.preview-card--1 { right: -2%; top: 29px; }.preview-card--2 { top: 60px; }.art-note { font-size: .65rem; bottom: 6px; }.art-spark--one { right: 14%; font-size: 26px; }.art-spark--two { left: 0; bottom: 0; }.age-tabs { gap: 7px; }.age-tabs button { padding: 12px 6px; text-align: center; min-height: 69px; border-radius: 12px; }.age-label { font-size: 1rem; }.age-stage { font-size: .6rem; }.section-aside { display: none; }.section-heading h2 { font-size: 1.02rem; }.deck-grid { grid-template-columns: 1fr; gap: 12px; }.collection { margin-top: 28px; }.age-note { padding: 15px; }.age-note p { font-size: .76rem; }.start-play { padding: 13px 14px; margin-top: 18px; gap: 7px; font-size: .8rem; }.start-arrow { margin-left: 4px; }.welcome-footnote { font-size: .64rem; }.deck-new { min-height: 104px; padding: 20px; }.home-footer { margin-top: 30px; }.footer-en { float: none; display: block; margin-top: 8px; margin-left: 22px; } }
@media (max-width: 380px) { .home-container { padding: 0 16px; }h1 { font-size: 1.6rem; }.welcome-art { height: 235px; }.preview-card { width: 92px; }.art-circle { width: 168px; height: 193px; }.age-label { font-size: .8rem; }.age-stage { font-size: .54rem; }.welcome-footnote { font-size: .6rem; } }
</style>
