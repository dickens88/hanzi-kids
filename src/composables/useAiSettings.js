import { computed, reactive, watch } from 'vue'
import { DEFAULT_MODEL } from '../utils/ark.js'

const SETTINGS_KEY = 'hanzi-kids:ai'
const CACHE_KEY = 'hanzi-kids:explanations'

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {}
  } catch {
    return {}
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable, keep it for this session only
  }
}

const saved = read(SETTINGS_KEY)
const settings = reactive({ apiKey: saved.apiKey || '', model: saved.model || DEFAULT_MODEL })
watch(settings, () => write(SETTINGS_KEY, settings))

const cache = read(CACHE_KEY)

export function useAiSettings() {
  return {
    settings,
    enabled: computed(() => !!settings.apiKey),
    cachedExplanation: (char) => cache[char] || null,
    saveExplanation(char, result) {
      cache[char] = result
      write(CACHE_KEY, cache)
    },
  }
}
