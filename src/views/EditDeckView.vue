<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { useDecks } from '@/composables/useDecks'
import { useBack } from '@/composables/useBack'
import type { AgeGroup, TprCard } from '@/types'
import { ageGroups } from '@/data/ages'
import { hasEmoji, uid } from '@/utils'
import AppHeader from '@/components/AppHeader.vue'
import Icon from '@/components/Icon.vue'
import CardVisual from '@/components/CardVisual.vue'
import { IMAGE_ACCEPT, validateCardImage, writeCardImages } from '@/storage/cardImages'

const props = defineProps<{ id: string }>()
const router = useRouter()
const { back } = useBack()
const { getDeck, createDeck, updateDeck, deleteDeck, duplicateDeck } = useDecks()

const isNew = computed(() => props.id === 'new')
const source = isNew.value ? undefined : getDeck(props.id)

// Built-in decks are read-only: fork them into a custom deck and edit that instead.
if (source?.builtIn) {
  const copyId = duplicateDeck(source.id)
  router.replace(copyId ? `/edit/${copyId}` : '/')
}

const COLORS = ['#356452', '#ff7a45', '#4f8cff', '#2dbd6e', '#a06bff', '#ff5c8a', '#ffb020', '#00b8d9', '#8d6e63']

const form = reactive({
  name: source?.name ?? '',
  emoji: source?.emoji ?? '🃏',
  color: source?.color ?? COLORS[0]!,
  description: source?.description ?? '',
  ageGroup: source?.ageGroup ?? '' as AgeGroup | '',
  cards: (source?.cards ?? []).map((c) => ({ ...c })) as TprCard[],
})

const snapshot = JSON.stringify(form)
const dirty = computed(() => JSON.stringify(form) !== snapshot)
const saved = ref(false)

const pendingImages = new Map<string, Blob>()
const previews = reactive<Record<string, string>>({})
const imageError = ref('')
const uploading = ref(0)
const saving = ref(false)

function clearPreview(id: string) {
  if (previews[id]) URL.revokeObjectURL(previews[id])
  delete previews[id]
}

async function uploadImage(event: Event, card: TprCard) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  uploading.value++
  imageError.value = ''
  try {
    await validateCardImage(file)
    if (!form.cards.includes(card)) return
    if (card.imageId) pendingImages.delete(card.imageId)
    const id = `image_${uid()}`
    pendingImages.set(id, file)
    clearPreview(card.id)
    previews[card.id] = URL.createObjectURL(file)
    card.imageId = id
  } catch (error) {
    imageError.value = error instanceof Error ? error.message : '图片上传失败，请重试'
  } finally { uploading.value-- }
}

function removeImage(card: TprCard) {
  if (card.imageId) pendingImages.delete(card.imageId)
  clearPreview(card.id)
  delete card.imageId
}

onBeforeUnmount(() => Object.keys(previews).forEach(clearPreview))

const enInputs = ref<HTMLInputElement[]>([])

async function addCard() {
  form.cards.push({ id: uid(), emoji: '', en: '', zh: '' })
  await nextTick()
  enInputs.value[form.cards.length - 1]?.focus()
}

function removeCard(i: number) {
  if (saving.value || uploading.value) return
  const card = form.cards[i]
  if (card) removeImage(card)
  form.cards.splice(i, 1)
}

function moveCard(i: number, delta: -1 | 1) {
  if (saving.value) return
  const j = i + delta
  if (j < 0 || j >= form.cards.length) return
  const cards = form.cards
  ;[cards[i], cards[j]] = [cards[j]!, cards[i]!]
}

/* ---------- bulk import ---------- */

const bulkOpen = ref(false)
const bulkText = ref('')

/**
 * Each line: `emoji | English | 中文`, `English | 中文` or just `English`.
 * Separators: `|`, `｜`, tab, or `,`.
 */
function parseBulk(text: string): TprCard[] {
  const out: TprCard[] = []
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    const parts = line
      .split(/\s*[|｜\t,，]\s*/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (!parts.length) continue
    let emoji = ''
    if (parts.length >= 2 && hasEmoji(parts[0]!) && parts[0]!.length <= 8) emoji = parts.shift()!
    const en = parts[0] ?? ''
    const zh = parts.slice(1).join(' ')
    if (en) out.push({ id: uid(), emoji, en, zh })
  }
  return out
}

function applyBulk() {
  const cards = parseBulk(bulkText.value)
  if (!cards.length) return
  form.cards.push(...cards)
  bulkText.value = ''
  bulkOpen.value = false
}

/* ---------- save / delete ---------- */

async function save() {
  if (saving.value || uploading.value) return
  saving.value = true
  imageError.value = ''
  if (form.cards.some((card) => card.imageId && !card.en.trim())) {
    imageError.value = '请为上传图片的卡片填写英文指令后再保存'
    saving.value = false
    return
  }
  const cards = form.cards
    .filter((c) => c.en.trim())
    .map((c) => ({ ...c, emoji: c.emoji.trim() || '🃏', en: c.en.trim(), zh: c.zh.trim() }))
  const payload = {
    name: form.name.trim() || '未命名卡组',
    emoji: form.emoji.trim() || '🃏',
    color: form.color,
    description: form.description.trim() || undefined,
    ageGroup: form.ageGroup || undefined,
    cards,
  }
  try {
    const imageIds = new Set(cards.map((card) => card.imageId))
    await writeCardImages(new Map([...pendingImages].filter(([id]) => imageIds.has(id))))
    if (isNew.value) {
      const id = createDeck(payload)
      saved.value = true
      router.replace(`/deck/${id}`)
    } else {
      if (!updateDeck(props.id, payload)) throw new Error('卡组已被删除')
      saved.value = true
      back(`/deck/${props.id}`)
    }
  } catch {
    imageError.value = '保存失败，请检查浏览器存储空间后重试。图片和修改仍保留在当前页面。'
  } finally { saving.value = false }
}

function remove() {
  if (saving.value || uploading.value) return
  if (!confirm(`确定删除「${form.name || '未命名卡组'}」？此操作不可恢复。`)) return
  saved.value = true
  deleteDeck(props.id)
  router.replace('/')
}

onBeforeRouteLeave(() => {
  if (!saved.value && (saving.value || uploading.value)) return false
  if (!saved.value && dirty.value && !confirm('有未保存的修改，确定离开？')) return false
  return true
})
</script>

<template>
  <div class="page paper-page editor-page">
    <AppHeader :title="isNew ? '新建卡组' : '编辑卡组'" :back="isNew ? '/' : `/deck/${id}`">
      <template #actions>
        <button class="icon-btn active" aria-label="保存" :disabled="saving || uploading > 0" @click="save">
          <Icon name="check" size="28" />
        </button>
      </template>
    </AppHeader>

    <main class="container">
      <fieldset class="edit-form" :disabled="saving" :aria-busy="saving">
      <div class="deck-meta">
        <div class="field field--emoji">
          <label for="deck-emoji">图标</label>
          <input id="deck-emoji" v-model="form.emoji" class="input input--emoji" maxlength="8" />
        </div>
        <div class="field field--name">
          <label for="deck-name">名称</label>
          <input id="deck-name" v-model="form.name" class="input" placeholder="例如：Unit 3 动作" />
        </div>
      </div>

      <div class="field">
        <label for="deck-desc">描述（可选）</label>
        <input id="deck-desc" v-model="form.description" class="input" placeholder="这组卡片用来练什么" />
      </div>

      <div class="field">
        <label for="deck-age">年龄段</label>
        <select id="deck-age" v-model="form.ageGroup" class="input">
          <option value="">未分类</option>
          <option v-for="age in ageGroups" :key="age.id" :value="age.id">{{ age.label }} · {{ age.range }}</option>
        </select>
      </div>

      <div class="field">
        <label>颜色</label>
        <div class="swatches">
          <button
            v-for="c in COLORS"
            :key="c"
            type="button"
            class="swatch"
            :class="{ 'swatch--on': form.color === c }"
            :style="{ background: c }"
            :aria-label="c"
            @click="form.color = c"
          />
        </div>
      </div>

      <section class="section">
        <div class="cards-head">
          <h2 class="section-title">卡片（{{ form.cards.length }}）</h2>
          <button class="btn btn-sm btn-ghost" @click="bulkOpen = !bulkOpen">批量添加</button>
        </div>

        <div v-if="bulkOpen" class="bulk">
          <textarea
            v-model="bulkText"
            class="input"
            placeholder="每行一张卡片，用 | 分隔：&#10;🦘 | Jump | 跳&#10;Sit down | 坐下&#10;Clap your hands"
          />
          <div class="bulk__actions">
            <button class="btn btn-sm" @click="bulkOpen = false">取消</button>
            <button class="btn btn-sm btn-primary" :disabled="!bulkText.trim()" @click="applyBulk">
              解析并添加
            </button>
          </div>
        </div>

        <div class="card-editor">
          <div v-for="(c, i) in form.cards" :key="c.id" class="card-edit">
            <input
              v-model="c.emoji"
              class="input card-edit__emoji"
              placeholder="😀"
              maxlength="8"
              aria-label="表情"
            />
            <div class="card-edit__fields">
              <input
                ref="enInputs"
                v-model="c.en"
                class="input"
                placeholder="English command"
                aria-label="英文指令"
                autocapitalize="sentences"
              />
              <input v-model="c.zh" class="input" placeholder="中文提示" aria-label="中文提示" />
            </div>
            <div class="card-edit__image">
              <CardVisual v-if="c.imageId" :card="c" thumbnail sizes="72px" :preview="previews[c.id]" />
              <label class="btn btn-sm image-upload" :class="{ 'image-upload--busy': saving || uploading > 0 }">
                <Icon name="upload" size="16" /> {{ c.imageId ? '替换图片' : '上传图片' }}
                <input type="file" :accept="IMAGE_ACCEPT" :disabled="saving || uploading > 0" @change="uploadImage($event, c)" />
              </label>
              <button v-if="c.imageId" class="btn btn-sm btn-ghost btn-danger" :disabled="saving || uploading > 0" @click="removeImage(c)">移除图片</button>
            </div>
            <div class="card-edit__tools">
              <button class="tool" :disabled="i === 0" aria-label="上移" @click="moveCard(i, -1)">
                <Icon name="arrow-up" size="18" />
              </button>
              <button
                class="tool"
                :disabled="i === form.cards.length - 1"
                aria-label="下移"
                @click="moveCard(i, 1)"
              >
                <Icon name="arrow-down" size="18" />
              </button>
              <button class="tool tool--danger" aria-label="删除" @click="removeCard(i)">
                <Icon name="trash" size="18" />
              </button>
            </div>
          </div>
        </div>

        <button class="btn btn-block add-card" @click="addCard"><Icon name="plus" /> 添加卡片</button>
      </section>

      <p class="image-note">每张卡片可上传一张图片（PNG / JPG / WebP / GIF / AVIF，最大 20 MB），保存后离线可用。</p>
      <p v-if="imageError" class="image-error" role="alert">{{ imageError }}</p>
      <button class="btn btn-primary btn-block save" :disabled="saving || uploading > 0" @click="save">
        <Icon name="check" /> {{ saving ? '保存中…' : uploading ? '读取图片中…' : '保存卡组' }}
      </button>
      <button v-if="!isNew" class="btn btn-block btn-ghost btn-danger" @click="remove">
        <Icon name="trash" /> 删除此卡组
      </button>
      </fieldset>
    </main>
  </div>
</template>

<style scoped>
.editor-page .image-upload {
  color: var(--primary);
  background: var(--paper-accent-soft);
  box-shadow: none;
}
.editor-page .cards-head .btn { color: var(--primary); }
.editor-page .bulk { padding: 14px; border: 1px solid var(--border); border-radius: 16px; background: var(--surface); }

.edit-form { border: 0; padding: 0; margin: 0; min-width: 0; }
.deck-meta {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 12px;
  margin-top: 8px;
}

.input--emoji {
  text-align: center;
  font-size: 1.6rem;
  padding: 6px;
}

.swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.swatch {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid transparent;
  transition: transform 0.1s;
}

.swatch--on {
  border-color: var(--text);
  transform: scale(1.1);
}

.cards-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cards-head .section-title {
  margin-bottom: 0;
}

.bulk {
  margin: 8px 0 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bulk__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.card-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.card-edit {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 10px;
  background: var(--surface);
  border-radius: 14px;
  border: 1px solid var(--border);
  box-shadow: none;
}

.card-edit__emoji {
  text-align: center;
  padding: 6px 4px;
  font-size: 1.4rem;
  min-height: 44px;
}

.card-edit__fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.card-edit__fields .input {
  min-height: 42px;
  padding: 6px 12px;
}

.card-edit__image { grid-column: 1 / 3; grid-row: 2; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.card-edit__image :deep(.card-visual) { width: 72px; flex: none; border-radius: 8px; }
.image-upload { position: relative; cursor: pointer; overflow: hidden; }
.image-upload input { position: absolute; inset: 0; opacity: 0; width: 100%; cursor: pointer; }
.image-upload--busy { opacity: .5; }
.image-note { font-size: .8rem; color: var(--muted); margin-top: 16px; line-height: 1.6; }
.image-error { color: var(--danger); margin-top: 12px; }
.card-edit__tools {
  grid-column: 3;
  grid-row: 1 / 3;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tool {
  width: 32px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--muted);
}

.tool:disabled {
  opacity: 0.3;
}

.tool--danger {
  color: var(--danger);
}

.add-card {
  margin-top: 12px;
  border: 2px dashed var(--border);
  box-shadow: none;
  background: transparent;
  color: var(--primary);
  border-color: color-mix(in srgb, var(--primary) 40%, var(--border));
}

.save {
  margin-top: 28px;
}
</style>
