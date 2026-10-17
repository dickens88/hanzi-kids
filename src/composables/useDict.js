import { toHex } from '../utils/hanzi.js'

const cache = new Map()

// Loads a character entry; resolves to null when the character is not in the dictionary.
export function loadChar(char) {
  if (!cache.has(char)) {
    const request = fetch(`/data/chars/${toHex(char)}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
    cache.set(char, request)
  }
  return cache.get(char)
}

export function loadStrokes(char) {
  return fetch(`/data/strokes/${toHex(char)}.json`).then((res) => {
    if (!res.ok) throw new Error(`no stroke data for ${char}`)
    return res.json()
  })
}
