const HANZI = /\p{Script=Han}/gu

export const toHex = (char) => char.codePointAt(0).toString(16)

// Returns the last Chinese character in the text, or null.
export function lastHanzi(text) {
  const all = text.match(HANZI)
  return all ? all[all.length - 1] : null
}
