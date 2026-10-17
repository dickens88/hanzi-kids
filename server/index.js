import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { explainCharacter } from './explain.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const charDir = path.join(root, 'public/data/chars')
const cacheFile = path.resolve(root, process.env.CACHE_FILE || 'data/explanations.json')
const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY)

const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : {}
const pending = new Map()

function saveCache() {
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true })
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 1))
}

function readEntry(char) {
  if ([...char].length !== 1) return null
  const file = path.join(charDir, `${char.codePointAt(0).toString(16)}.json`)
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null
}

const app = new Hono()

app.get('/api/features', (c) => c.json({ aiExplanation: aiEnabled }))

app.get('/api/characters/:char/explanation', async (c) => {
  if (!aiEnabled) return c.json({ error: 'AI explanation is not configured' }, 503)
  const char = c.req.param('char')
  const entry = readEntry(char)
  if (!entry) return c.json({ error: 'unknown character' }, 404)
  if (cache[char]) return c.json(cache[char])

  // share one in-flight request per character
  if (!pending.has(char)) {
    pending.set(
      char,
      explainCharacter(entry)
        .then((result) => {
          cache[char] = result
          saveCache()
          return result
        })
        .finally(() => pending.delete(char)),
    )
  }
  try {
    return c.json(await pending.get(char))
  } catch (err) {
    console.error(`explain ${char} failed:`, err.message)
    return c.json({ error: 'explanation failed' }, 502)
  }
})

app.use('/*', serveStatic({ root: path.relative(process.cwd(), distDir) }))
app.get('/data/*', (c) => c.notFound())
app.get('*', serveStatic({ path: path.relative(process.cwd(), path.join(distDir, 'index.html')) }))

const port = Number(process.env.PORT || 8787)
serve({ fetch: app.fetch, port }, () => {
  console.log(`小墨识字 running on http://localhost:${port} (AI explanation ${aiEnabled ? 'on' : 'off'})`)
})
