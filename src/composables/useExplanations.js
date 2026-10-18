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

// Earlier versions kept the parent's Ark key here; the key now lives on Cloudflare
try {
  localStorage.removeItem('hanzi-kids:ai')
} catch {
  // storage unavailable, nothing to clean up
}

const cache = read(CACHE_KEY)

// Asks the Pages Function (functions/api/explain.js), which holds the Ark key
async function fetchExplanation(char) {
  const res = await fetch('/api/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ char }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
  return res.json()
}

export function useExplanations() {
  return {
    async explain(char) {
      if (!cache[char]) {
        cache[char] = await fetchExplanation(char)
        write(CACHE_KEY, cache)
      }
      return cache[char]
    },
  }
}
