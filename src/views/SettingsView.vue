<script setup lang="ts">
import { ref } from 'vue'
import { useDecks } from '@/composables/useDecks'
import { useInstallPrompt } from '@/composables/useInstallPrompt'
import { useSettings, type Theme } from '@/composables/useSettings'
import { useSpeech } from '@/composables/useSpeech'
import type { DeckExport, TprDeck } from '@/types'
import { downloadText } from '@/utils'
import AppHeader from '@/components/AppHeader.vue'
import Icon from '@/components/Icon.vue'

const { settings, reset } = useSettings()
const { supported: speechSupported, englishVoices, speak, refreshVoices } = useSpeech()
const { customDecks, importDecks, clearCustom } = useDecks()
const { canInstall, isStandalone, isIOS, install } = useInstallPrompt()

const version = __APP_VERSION__

const themes: { value: Theme; label: string }[] = [
  { value: 'auto', label: '跟随系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
]

const message = ref('')
function flash(text: string) {
  message.value = text
  setTimeout(() => (message.value = ''), 2500)
}

function testVoice() {
  refreshVoices()
  speak('Stand up. Touch your nose. Jump three times.')
}

function exportDecks() {
  if (!customDecks.value.length) return flash('还没有自定义卡组')
  const data: DeckExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    decks: customDecks.value,
  }
  const stamp = new Date().toISOString().slice(0, 10)
  downloadText(`tpr-cards-${stamp}.json`, JSON.stringify(data, null, 2))
}

const fileInput = ref<HTMLInputElement | null>(null)

async function onImportFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const parsed = JSON.parse(await file.text()) as Partial<DeckExport> | TprDeck[]
    const decks = Array.isArray(parsed) ? parsed : parsed.decks
    if (!Array.isArray(decks)) throw new Error('bad format')
    const n = importDecks(decks)
    flash(n ? `已导入 ${n} 个卡组` : '文件里没有可导入的卡组')
  } catch {
    flash('导入失败：不是有效的卡组文件')
  }
}

function clearAll() {
  if (!confirm(`确定删除全部 ${customDecks.value.length} 个自定义卡组？此操作不可恢复。`)) return
  clearCustom()
  flash('已清空自定义卡组')
}

function resetSettings() {
  if (!confirm('恢复默认设置？')) return
  reset()
  flash('已恢复默认设置')
}
</script>

<template>
  <div class="page">
    <AppHeader title="设置" />

    <main class="container">
      <section class="group">
        <h2 class="section-title">语音朗读</h2>
        <div class="card">
          <template v-if="speechSupported">
            <div class="row">
              <label for="voice">英语声音</label>
              <select id="voice" v-model="settings.voiceURI" class="input select" @focus="refreshVoices">
                <option value="">自动选择</option>
                <option v-for="v in englishVoices" :key="v.voiceURI" :value="v.voiceURI">
                  {{ v.name }} ({{ v.lang }})
                </option>
              </select>
            </div>
            <div class="row row--col">
              <div class="row__head">
                <label for="rate">语速</label>
                <span class="value">{{ settings.rate.toFixed(1) }}×</span>
              </div>
              <input id="rate" v-model.number="settings.rate" type="range" min="0.5" max="1.5" step="0.1" />
            </div>
            <div class="row">
              <label for="auto-speak">切换卡片时自动朗读</label>
              <span class="switch">
                <input id="auto-speak" v-model="settings.autoSpeak" type="checkbox" />
                <span />
              </span>
            </div>
            <div class="row row--end">
              <button class="btn btn-sm" @click="testVoice"><Icon name="speaker" size="18" /> 试听</button>
            </div>
          </template>
          <p v-else class="note">当前浏览器不支持语音合成（Web Speech API）。</p>
        </div>
      </section>

      <section class="group">
        <h2 class="section-title">播放</h2>
        <div class="card">
          <div class="row row--col">
            <div class="row__head">
              <label for="interval">自动播放间隔</label>
              <span class="value">{{ settings.autoPlayInterval }} 秒</span>
            </div>
            <input
              id="interval"
              v-model.number="settings.autoPlayInterval"
              type="range"
              min="2"
              max="20"
              step="1"
            />
          </div>
          <div class="row">
            <label for="show-zh">默认显示中文提示</label>
            <span class="switch">
              <input id="show-zh" v-model="settings.showZh" type="checkbox" />
              <span />
            </span>
          </div>
          <div class="row">
            <label for="keep-awake">播放时保持屏幕常亮</label>
            <span class="switch">
              <input id="keep-awake" v-model="settings.keepAwake" type="checkbox" />
              <span />
            </span>
          </div>
        </div>
      </section>

      <section class="group">
        <h2 class="section-title">Simon Says 游戏模式</h2>
        <div class="card">
          <div class="row">
            <label for="simon">
              启用 Simon Says
              <small>随机给指令加上 "Simon says" 前缀，没有前缀时不能做动作</small>
            </label>
            <span class="switch">
              <input id="simon" v-model="settings.simonSays" type="checkbox" />
              <span />
            </span>
          </div>
          <div v-if="settings.simonSays" class="row row--col">
            <div class="row__head">
              <label for="simon-chance">出现 "Simon says" 的概率</label>
              <span class="value">{{ Math.round(settings.simonChance * 100) }}%</span>
            </div>
            <input
              id="simon-chance"
              v-model.number="settings.simonChance"
              type="range"
              min="0.1"
              max="0.9"
              step="0.1"
            />
          </div>
        </div>
      </section>

      <section class="group">
        <h2 class="section-title">外观</h2>
        <div class="card">
          <div class="segmented">
            <button
              v-for="t in themes"
              :key="t.value"
              class="segmented__item"
              :class="{ 'segmented__item--on': settings.theme === t.value }"
              @click="settings.theme = t.value"
            >
              {{ t.label }}
            </button>
          </div>
        </div>
      </section>

      <section class="group">
        <h2 class="section-title">我的卡组数据</h2>
        <div class="card">
          <div class="row">
            <label>导出为 JSON 文件<small>{{ customDecks.length }} 个自定义卡组</small></label>
            <button class="btn btn-sm" :disabled="!customDecks.length" @click="exportDecks">
              <Icon name="download" size="18" /> 导出
            </button>
          </div>
          <div class="row">
            <label>从 JSON 文件导入<small>相同 id 的卡组会被覆盖</small></label>
            <button class="btn btn-sm" @click="fileInput?.click()">
              <Icon name="upload" size="18" /> 导入
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="application/json,.json"
              hidden
              @change="onImportFile"
            />
          </div>
          <div class="row">
            <label>清空全部自定义卡组</label>
            <button class="btn btn-sm btn-danger" :disabled="!customDecks.length" @click="clearAll">
              <Icon name="trash" size="18" /> 清空
            </button>
          </div>
        </div>
      </section>

      <section class="group">
        <h2 class="section-title">安装与离线</h2>
        <div class="card">
          <p v-if="isStandalone" class="note">✅ 已安装为应用，所有卡片离线可用。</p>
          <template v-else-if="canInstall">
            <p class="note">安装后可像普通 App 一样从主屏幕打开，并离线使用。</p>
            <div class="row row--end">
              <button class="btn btn-sm btn-primary" @click="install">
                <Icon name="download" size="18" /> 安装到主屏幕
              </button>
            </div>
          </template>
          <p v-else-if="isIOS" class="note">
            在 Safari 中点击底部 <strong>分享</strong> 按钮，选择 <strong>添加到主屏幕</strong> 即可安装。
          </p>
          <p v-else class="note">在浏览器菜单中选择「安装应用」或「添加到主屏幕」即可离线使用。</p>
        </div>
      </section>

      <section class="group">
        <h2 class="section-title">关于</h2>
        <div class="card">
          <div class="row">
            <label>TPR 指令卡<small>版本 {{ version }} · 数据仅保存在本机</small></label>
            <button class="btn btn-sm btn-ghost" @click="resetSettings">恢复默认设置</button>
          </div>
          <p class="note">
            键盘快捷键：← → 切换 · 空格 朗读 · 回车 自动播放 · H 显示/隐藏中文 · Esc 退出
          </p>
        </div>
      </section>
    </main>

    <Transition name="fade">
      <div v-if="message" class="toast">{{ message }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.group {
  margin-top: 24px;
}

.card {
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 4px 16px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 56px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.row:last-child {
  border-bottom: 0;
}

.row > label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-weight: 600;
  flex: 1;
}

.row > label small {
  font-weight: 400;
  font-size: 0.8rem;
  color: var(--muted);
}

.row--col {
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
}

.row__head {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
}

.row--end {
  justify-content: flex-end;
}

.value {
  color: var(--primary);
  font-variant-numeric: tabular-nums;
}

.select {
  flex: 1;
  max-width: 60%;
  min-height: 42px;
  padding: 6px 10px;
}

.segmented {
  display: flex;
  padding: 10px 0;
  gap: 4px;
  background: transparent;
}

.segmented__item {
  flex: 1;
  min-height: 42px;
  border-radius: 10px;
  font-weight: 600;
  color: var(--muted);
  background: var(--surface-2);
  transition:
    background 0.15s,
    color 0.15s;
}

.segmented__item--on {
  background: var(--primary);
  color: #fff;
}

.note {
  padding: 12px 0;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.5;
}
</style>
