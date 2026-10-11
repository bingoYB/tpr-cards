import type { AgeGroup, TprDeck } from '@/types'

type Row = [emoji: string, en: string, zh: string, tip?: string]
function makeDeck(id: string, name: string, ageGroup: AgeGroup, emoji: string, color: string, description: string, rows: Row[], illustrated = false): TprDeck {
  return { id, name, ageGroup, emoji, color, description, builtIn: true,
    cards: rows.map(([emoji, en, zh, tip], i) => ({ id: `${id}-${i + 1}`, emoji, en, zh, tip, ...(illustrated ? { illustration: i } : {}) })),
  }
}

export const ageDecks: TprDeck[] = [
  makeDeck('baby-first', '宝宝的第一组动作', '1', '🧸', '#a58acb', '12 张亲子插画卡 · 从拍手、挥手到一起玩。11 个多月可以先由大人示范。', [
    ['👏', 'Clap your hands', '拍拍手', '大人先慢慢拍两下，等宝宝看或模仿。'],
    ['👋', 'Wave hello', '挥手打招呼', '面对宝宝挥手，也可以在见面时说。'],
    ['🙌', 'Arms up', '举起小手', '抱起宝宝前说一遍，等宝宝尝试举手。'],
    ['🙆', 'Touch your head', '摸摸头', '先摸自己的头，宝宝愿意时再一起试。'],
    ['👃', 'Touch your nose', '摸摸鼻子', '用自己的鼻子示范，轻轻碰一下。'],
    ['👂', 'Touch your ear', '摸摸耳朵', '大人慢慢示范，不拉扯耳朵。'],
    ['🧸', 'Give me the teddy', '把小熊给我', '伸出手，等宝宝把大号毛绒玩具递过来。'],
    ['🧺', 'Put it in', '放进去', '用大块玩具和敞口篮子示范放进去。'],
    ['⚽', 'Roll the ball', '滚滚球', '和宝宝坐在地垫上，把大球轻轻滚过去。'],
    ['🙈', 'Peekaboo', '躲猫猫', '大人遮住自己的脸再露出来，宝宝看着玩即可。'],
    ['📖', 'Turn the page', '翻一页', '一起翻厚纸板书，大人可以协助。'],
    ['🤗', 'Give me a hug', '抱抱我', '张开手臂邀请宝宝，尊重宝宝的意愿。'],
  ], true),
  makeDeck('toddler-play', '生活与玩具', '2', '🪁', '#e9a846', '12 张单步指令 · 收拾玩具、认识物品、参与生活。', [
    ['🧸', 'Pick up the teddy', '拿起小熊'], ['🧺', 'Put the toy away', '把玩具收好'],
    ['⚽', 'Bring me the ball', '把球拿过来'], ['🧱', 'Stack the blocks', '把积木叠起来'],
    ['📦', 'Open the box', '打开盒子'], ['📦', 'Close the box', '合上盒子'],
    ['📖', 'Find the cat', '找找书里的小猫'], ['🧼', 'Wash your hands', '洗洗手', '由大人协助洗手。'],
    ['🧻', 'Wipe your hands', '擦擦手'], ['🪑', 'Sit on the chair', '坐在小椅子上'],
    ['🧸', 'Feed the teddy', '假装喂小熊', '用玩具勺子玩假装游戏。'], ['👋', 'Wave goodbye', '挥手说再见'],
  ]),
  makeDeck('preschool-play', '模仿与发现', '3', '🌈', '#55aa8a', '12 张动作游戏卡 · 从模仿走向颜色与两步指令。', [
    ['🐦', 'Flap your arms', '像小鸟一样扇扇手臂'], ['🐱', 'Stretch like a cat', '像小猫一样伸懒腰'],
    ['🐧', 'Walk like a penguin', '像企鹅一样走'], ['🐢', 'Move slowly', '慢慢移动'],
    ['🛑', 'Dance and stop', '跳舞，然后停下来'], ['👣', 'Take two steps', '走两步'],
    ['🔴', 'Find a red block', '找一块红色积木'], ['🔵', 'Put the blue block in the box', '把蓝色积木放进盒子'],
    ['👏', 'Clap, then wave', '先拍手，再挥手'], ['🙆', 'Touch your head, then your knees', '先摸头，再摸膝盖'],
    ['🧸', 'Put the teddy on the chair', '把小熊放在椅子上'], ['😊', 'Make a happy face', '做个开心的表情'],
  ]),
  makeDeck('kids-challenge', '听指令小挑战', '4-6', '🧭', '#5c8fcc', '12 张进阶卡 · 方位、数量、顺序与合作游戏。', [
    ['👏', 'Clap twice, then sit down', '拍两下手，再坐下'], ['⬅️', 'Take one step to the left', '向左跨一步'],
    ['➡️', 'Take two steps to the right', '向右跨两步'], ['🧸', 'Put the teddy under the table', '把小熊放在桌子下面'],
    ['🪑', 'Stand behind the chair', '站在椅子后面'], ['🧱', 'Put three blocks in a row', '把三块积木排成一行'],
    ['🔴', 'Find something red and bring it here', '找一个红色物品，拿到这里'], ['🙆', 'Touch your shoulders, knees and toes', '依次摸肩膀、膝盖和脚趾'],
    ['🐦', 'Fly like a bird, then freeze', '像鸟一样飞，再保持不动'], ['🤝', 'Stand next to your partner', '站在同伴旁边'],
    ['🔁', 'Turn around, then clap three times', '转身，再拍三下手'], ['🎨', 'Point to blue, then yellow', '先指蓝色，再指黄色'],
  ]),
]
