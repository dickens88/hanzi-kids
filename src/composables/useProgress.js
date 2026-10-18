import { computed, reactive, watch } from 'vue'
import { LEVELS, levelFor } from '../utils/levels.js'

const KEY = 'hanzi-kids:progress'

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

const saved = read()
const state = reactive({ chars: saved.chars || {}, days: saved.days || [], avatar: saved.avatar || 0 })
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

const level = computed(() => levelFor(learnedCount.value))

// The rabbit the child picked; until they pick one it follows the current level.
const avatar = computed(() => LEVELS[Math.min(state.avatar || level.value.level, level.value.level) - 1])

function chooseAvatar(n) {
  if (n <= level.value.level) state.avatar = n
}

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
  const levelUp = !prev ? LEVELS.find((l) => l.count === learnedCount.value) || null : null
  if (levelUp) state.avatar = levelUp.level
  return { isNew: !prev, levelUp }
}

export function useProgress() {
  return {
    learned,
    learnedCount,
    streak,
    level,
    avatar,
    chooseAvatar,
    record,
    starsFor: (char) => state.chars[char]?.stars || 0,
  }
}
