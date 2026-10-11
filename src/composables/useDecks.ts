import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { builtInDecks } from '@/data/decks'
import type { TprCard, TprDeck } from '@/types'
import { uid } from '@/utils'
import { isAgeGroup, ageLabel } from '@/data/ages'

/** Virtual deck id that mixes every card from every deck. */
export const ALL_DECK_ID = 'all'

const customDecks = useLocalStorage<TprDeck[]>('tpr.customDecks', [])

const allDecks = computed<TprDeck[]>(() => [...builtInDecks, ...customDecks.value])
const totalCards = computed(() => allDecks.value.reduce((n, d) => n + d.cards.length, 0))

const allDeck = computed<TprDeck>(() => ({
  id: ALL_DECK_ID,
  name: '全部卡片',
  emoji: '🎲',
  color: '#ff7a45',
  description: '混合所有卡组',
  builtIn: true,
  cards: allDecks.value.flatMap((d) => d.cards),
}))

export type DeckInput = Pick<TprDeck, 'name' | 'emoji' | 'color' | 'description' | 'cards' | 'ageGroup'>

export function useDecks() {
  function getDeck(id: string, age?: unknown): TprDeck | undefined {
    if (id === ALL_DECK_ID && isAgeGroup(age)) {
      return { ...allDeck.value, name: `${ageLabel(age)} · 全部卡片`, ageGroup: age, cards: allDecks.value.filter((d) => d.ageGroup === age).flatMap((d) => d.cards) }
    }
    if (id === ALL_DECK_ID) return allDeck.value
    return allDecks.value.find((d) => d.id === id)
  }

  function createDeck(input: DeckInput): string {
    const id = `c_${uid()}`
    customDecks.value = [...customDecks.value, { ...input, id, builtIn: false }]
    return id
  }

  function updateDeck(id: string, patch: Partial<DeckInput>): boolean {
    const idx = customDecks.value.findIndex((d) => d.id === id)
    if (idx < 0) return false
    const next = [...customDecks.value]
    next[idx] = { ...next[idx]!, ...patch }
    customDecks.value = next
    return true
  }

  function deleteDeck(id: string) {
    customDecks.value = customDecks.value.filter((d) => d.id !== id)
  }

  /** Copy any deck (built-in or custom) into an editable custom deck. Returns the new id. */
  function duplicateDeck(id: string): string | undefined {
    const src = getDeck(id)
    if (!src) return undefined
    const cards: TprCard[] = src.cards.map((c) => ({ ...c, id: uid() }))
    return createDeck({
      name: `${src.name}（副本）`,
      emoji: src.emoji,
      color: src.color,
      description: src.description,
      ageGroup: src.ageGroup,
      cards,
    })
  }

  /** Merge imported decks: same id replaces, otherwise append. Returns how many were imported. */
  function importDecks(decks: TprDeck[]): number {
    const map = new Map(customDecks.value.map((d) => [d.id, d]))
    let count = 0
    for (const raw of decks) {
      if (!raw || typeof raw !== 'object' || !Array.isArray(raw.cards)) continue
      const id = typeof raw.id === 'string' && raw.id.startsWith('c_') ? raw.id : `c_${uid()}`
      map.set(id, {
        id,
        name: String(raw.name ?? '未命名卡组'),
        emoji: String(raw.emoji ?? '🃏'),
        color: String(raw.color ?? '#ff7a45'),
        description: raw.description ? String(raw.description) : undefined,
        builtIn: false,
        ageGroup: isAgeGroup(raw.ageGroup) ? raw.ageGroup : undefined,
        cards: raw.cards
          .filter((c) => c && typeof c.en === 'string' && c.en.trim())
          .map((c) => ({
            id: typeof c.id === 'string' ? c.id : uid(),
            emoji: String(c.emoji ?? '🃏'),
            en: c.en.trim(),
            zh: String(c.zh ?? '').trim(),
            tip: typeof c.tip === 'string' ? c.tip : undefined,
            illustration: Number.isInteger(c.illustration) && c.illustration! >= 0 && c.illustration! < 12 ? c.illustration : undefined,
          })),
      })
      count++
    }
    customDecks.value = [...map.values()]
    return count
  }

  function clearCustom() {
    customDecks.value = []
  }

  return {
    builtInDecks,
    customDecks,
    allDecks,
    totalCards,
    getDeck,
    createDeck,
    updateDeck,
    deleteDeck,
    duplicateDeck,
    importDecks,
    clearCustom,
  }
}
