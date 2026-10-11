import type { AgeGroup } from '@/types'

/** Activity difficulty guides, not developmental milestones. */
export const ageGroups: { id: AgeGroup; label: string; range: string; hint: string }[] = [
  { id: '1', label: '1 岁', range: '约 11–23 个月', hint: '大人先示范，宝宝看、听或尝试都可以。每次选 3–5 张，在真实玩耍中重复，不要求说英语或独立完成动作。' },
  { id: '2', label: '2 岁', range: '24–35 个月', hint: '从一个动作开始，结合玩具与日常生活，熟悉后再尝试简单的连续动作。' },
  { id: '3', label: '3 岁', range: '36–47 个月', hint: '增加模仿、颜色和简单的两步指令。动作难度按孩子的实际能力调整。' },
  { id: '4-6', label: '4–6 岁', range: '48–83 个月', hint: '用方位、数量和多步指令玩游戏，也可以开启 Simon Says。' },
]

export function isAgeGroup(value: unknown): value is AgeGroup {
  return ageGroups.some((age) => age.id === value)
}

export function ageLabel(value?: AgeGroup) {
  return ageGroups.find((age) => age.id === value)?.label ?? '未分类'
}
