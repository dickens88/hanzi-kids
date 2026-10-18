// Builds public/data/chars/<codepoint>.json from open dictionary sources.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cacheDir = path.join(root, '.cache')
const outDir = path.join(root, 'public/data/chars')
const strokeDir = path.join(root, 'node_modules/hanzi-writer-data')

const MAPULL = 'https://raw.githubusercontent.com/mapull/chinese-dictionary/master'
const SOURCES = {
  'char_common_base.json': `${MAPULL}/character/common/char_common_base.json`,
  'char_common_detail.json': `${MAPULL}/character/common/char_common_detail.json`,
  'char_base.json': `${MAPULL}/character/char_base.json`,
  'char_detail.json': `${MAPULL}/character/char_detail.json`,
  'word.json': `${MAPULL}/word/word.json`,
  'xinhua-ci.json': 'https://raw.githubusercontent.com/pwxcoo/chinese-xinhua/master/data/ci.json',
  'jieba.txt': 'https://raw.githubusercontent.com/fxsjy/jieba/master/jieba/dict.txt',
}

const MAX_WORDS = 8
const MAX_LONG_WORDS = 2
const MAX_MEANINGS = 3
const MAX_MEANING_LEN = 30
const MIN_FREQ = 30
const MIN_FREQ_UNLISTED = 100
// jieba POS tags for person and organization names
const SKIP_POS = new Set(['nr', 'nrt', 'nrfg', 'nt'])
const SKIP_MEANINGS = new Set(['姓', '又', '同本义'])
const UNSUITABLE_MEANING = /詈|骂人|妓|淫|私通|生殖器|阴茎/

const readList = (name) => fs.readFileSync(path.join(root, 'scripts', name), 'utf8')
const BLOCKED_WORDS = new Set(readList('blocked-words.txt').split(/\s+/).filter(Boolean))
const BLOCKED_CHARS = new Set(readList('blocked-chars.txt').trim())
const OVERRIDES = JSON.parse(readList('overrides.json'))

async function load(name) {
  const file = path.join(cacheDir, name)
  if (!fs.existsSync(file)) {
    console.log(`downloading ${SOURCES[name]}`)
    const res = await fetch(SOURCES[name])
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`)
    fs.mkdirSync(cacheDir, { recursive: true })
    fs.writeFileSync(file, await res.text())
  }
  return fs.readFileSync(file, 'utf8')
}

// mapull char files are one JSON object per line with trailing commas
function parseLines(text) {
  return text
    .split('\n')
    .map((l) => l.trim().replace(/,$/, ''))
    .filter((l) => l.startsWith('{'))
    .map((l) => JSON.parse(l))
}

const normPinyin = (p) => p.replace(/ɡ/g, 'g').trim()

// Splits a leading "(...)" etymology note (may contain nested parens) from the rest.
function splitEtymology(text) {
  if (!/^[(（]/.test(text)) return [null, text]
  let depth = 0
  for (let i = 0; i < text.length; i++) {
    if ('(（'.includes(text[i])) depth++
    if (')）'.includes(text[i]) && --depth === 0) return [text.slice(1, i), text.slice(i + 1)]
  }
  return [text, '']
}

function shorten(text) {
  if (text.length <= MAX_MEANING_LEN) return text
  const cut = text.slice(4).search(/[,，;；。]/)
  return cut >= 0 && cut + 4 <= MAX_MEANING_LEN ? text.slice(0, cut + 4).trim() : null
}

function cleanMeanings(explanations) {
  const out = []
  let origin = null
  for (const e of explanations) {
    if (e.simplified || e.variant || e.typo || e.unknown || !e.content) continue
    const [etym, rest] = splitEtymology(e.content.trim())
    if (etym) origin = etym.match(/本义[:：]?(.+)$/)?.[1].split(/[。.]/)[0].trim() || origin
    let text = rest
      .replace(/^[\s。.,，;；)）]+/, '')
      .replace(/\s*——.*$/, '')
      .replace(/[。.]+$/, '')
      .trim()
    if (text.startsWith('同本义')) text = origin || ''
    text = text && shorten(text)
    if (!text || SKIP_MEANINGS.has(text) || /^注意/.test(text) || UNSUITABLE_MEANING.test(text)) continue
    if (!out.includes(text)) out.push(text)
    if (out.length >= MAX_MEANINGS) break
  }
  if (!out.length && origin) out.push(origin)
  return out
}

function readingInWord(word, pinyin, char) {
  const syllables = pinyin.split(/\s+/)
  const chars = [...word]
  if (syllables.length !== chars.length) return null
  return normPinyin(syllables[chars.indexOf(char)])
}

// Picks common words, preferring 2-char ones, skipping superstrings, covering every reading.
function pickWords(ranked, readingsUsed) {
  const picked = []
  const longCount = () => picked.filter((w) => w.word.length > 2).length
  const tryAdd = (w) => {
    if (picked.length >= MAX_WORDS || picked.includes(w)) return
    if (w.word.length > 2 && longCount() >= MAX_LONG_WORDS) return
    if (picked.some((p) => w.word.includes(p.word) || p.word.includes(w.word))) return
    picked.push(w)
  }
  // reserve up to 2 words for each secondary reading
  for (const r of readingsUsed.slice(1)) ranked.filter((w) => w.reading === r).slice(0, 2).forEach(tryAdd)
  ranked.forEach(tryAdd)
  return picked.sort((a, b) => b.freq - a.freq).map(({ word, pinyin, reading }) => ({ word, pinyin, reading }))
}

async function main() {
  const base = parseLines(await load('char_common_base.json'))
  const detail = new Map(parseLines(await load('char_common_detail.json')).map((d) => [d.char, d]))
  // textbook characters outside the common list come from the full character set
  const textbookChars = new Set(JSON.parse(readList('../public/data/textbook.json')).flatMap((b) => b.lessons.flatMap((l) => [...l.xiezi, ...l.shizi])))
  const common = new Set(base.map((b) => b.char))
  const extra = new Set([...textbookChars].filter((c) => !common.has(c)))
  base.push(...parseLines(await load('char_base.json')).filter((b) => extra.has(b.char)))
  for (const d of parseLines(await load('char_detail.json'))) if (extra.has(d.char)) detail.set(d.char, d)
  const dictWords = new Map(JSON.parse(await load('word.json')).map((w) => [w.word, normPinyin(w.pinyin)]))
  const xinhuaWords = new Set(JSON.parse(await load('xinhua-ci.json')).map((w) => w.ci))
  const monoPinyin = new Map(base.filter((b) => common.has(b.char) && b.pinyin.length === 1).map((b) => [b.char, normPinyin(b.pinyin[0])]))
  // dictionary pinyin, or composed from single-reading characters for well-attested words
  const wordPinyin = (w, n) => {
    if (dictWords.has(w)) return dictWords.get(w)
    const attested = xinhuaWords.has(w) || n >= MIN_FREQ_UNLISTED
    return attested && [...w].every((c) => monoPinyin.has(c)) ? [...w].map((c) => monoPinyin.get(c)).join(' ') : null
  }

  // word -> [frequency, pinyin]
  const freq = new Map()
  for (const line of (await load('jieba.txt')).split('\n')) {
    const [word, f, pos] = line.split(' ')
    const n = Number(f)
    const len = [...(word || '')].length
    if (len < 2 || len > 4 || n < MIN_FREQ || SKIP_POS.has(pos)) continue
    if (!/^[一-鿿]+$/.test(word) || BLOCKED_WORDS.has(word) || (freq.get(word)?.[0] ?? 0) >= n) continue
    const pinyin = wordPinyin(word, n)
    if (!pinyin) continue
    if ([...word].some((c) => BLOCKED_CHARS.has(c))) continue
    freq.set(word, [n, pinyin])
  }

  const byChar = new Map()
  for (const [word, [n, pinyin]] of freq) {
    for (const c of new Set(word)) {
      if (!byChar.has(c)) byChar.set(c, [])
      byChar.get(c).push({ word, pinyin, reading: readingInWord(word, pinyin, c), freq: n })
    }
  }

  fs.rmSync(outDir, { recursive: true, force: true })
  fs.mkdirSync(outDir, { recursive: true })
  const skipped = []
  for (const b of base) {
    if (!fs.existsSync(path.join(strokeDir, `${b.char}.json`)) || BLOCKED_CHARS.has(b.char)) {
      skipped.push(b.char)
      continue
    }

    const ranked = (byChar.get(b.char) || []).sort((x, y) => y.freq - x.freq)
    const pronunciations = new Map((detail.get(b.char)?.pronunciations || []).map((p) => [normPinyin(p.pinyin), p.explanations]))
    const overrides = OVERRIDES[b.char] || {}
    const usage = (p) => ranked.filter((w) => w.reading === p).reduce((s, w) => s + w.freq, 0)
    const allReadings = [...new Set([...Object.keys(overrides), ...b.pinyin.map(normPinyin), ...pronunciations.keys()])]
    // overrides first, then readings with meanings, then most used
    const candidates = allReadings
      .map((p, i) => ({ p, i, u: usage(p), meanings: overrides[p] || cleanMeanings(pronunciations.get(p) || []) }))
      .filter((r) => r.i === 0 || r.u > 0 || overrides[r.p])
      .sort((x, y) => Number(!!overrides[y.p]) - Number(!!overrides[x.p]) || Number(y.meanings.length > 0) - Number(x.meanings.length > 0) || y.u - x.u || x.i - y.i)

    // secondary readings without meanings are rare, drop them with their words
    const kept = candidates.filter((r, i) => i === 0 || r.meanings.length)
    const keptPinyin = new Set(kept.map((r) => r.p))
    const words = pickWords(ranked.filter((w) => kept.length === 1 || keptPinyin.has(w.reading)), kept.map((r) => r.p))
    const readings = kept.map((r) => ({ pinyin: r.p, meanings: r.meanings }))
    if (!readings.length) {
      skipped.push(b.char)
      continue
    }

    const entry = { char: b.char, radical: b.radicals, strokes: b.strokes, level: b.frequency, readings, words }
    fs.writeFileSync(path.join(outDir, `${b.char.codePointAt(0).toString(16)}.json`), JSON.stringify(entry))
  }
  console.log(`wrote ${base.length - skipped.length} characters (${extra.size} added for the textbook), skipped ${skipped.length}: ${skipped.join('')}`)
  const missing = [...textbookChars].filter((c) => !fs.existsSync(path.join(outDir, `${c.codePointAt(0).toString(16)}.json`)))
  if (missing.length) console.log(`textbook characters missing from the dictionary: ${missing.join('')}`)
}

main()
