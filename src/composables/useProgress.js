import { computed, reactive, watch } from 'vue'

const KEY = 'hanzi-kids:progress'
export const BADGES = [
  { count: 10, emoji: '🌱', name: '识字小芽' },
  { count: 30, emoji: '🌳', name: '识字小树' },
  { count: 100, emoji: '🏞️', name: '识字大森林' },
  { count: 300, emoji: '🎓', name: '识字小博士' },
]

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

const saved = read()
const state = reactive({ chars: saved.chars || {}, days: saved.days || [] })
watch(state, () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage unavailable, progress lives for this session only
  }
})

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

const learnedCount = computed(() => Object.keys(state.chars).length)

const streak = computed(() => {
  const days = new Set(state.days)
  const d = new Date()
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (days.has(dayKey(d))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
})

const learned = computed(() =>
  Object.entries(state.chars)
    .map(([char, p]) => ({ char, ...p }))
    .sort((a, b) => b.lastAt - a.lastAt),
)

const earnedBadges = computed(() => BADGES.filter((b) => learnedCount.value >= b.count))

// Saves a practice result and reports what was newly unlocked.
function record(char, stars) {
  const prev = state.chars[char]
  const now = Date.now()
  state.chars[char] = {
    stars: Math.max(stars, prev?.stars || 0),
    times: (prev?.times || 0) + 1,
    lastAt: now,
  }
  const today = dayKey(new Date())
  if (!state.days.includes(today)) state.days.push(today)
  return {
    isNew: !prev,
    badge: !prev ? BADGES.find((b) => b.count === learnedCount.value) || null : null,
  }
}

export function useProgress() {
  return { learned, learnedCount, streak, earnedBadges, record, starsFor: (char) => state.chars[char]?.stars || 0 }
}
