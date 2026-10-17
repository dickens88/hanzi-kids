import { Hono } from 'hono'
import { explainCharacter } from './explain.js'

const app = new Hono()

app.get('/api/features', (c) => c.json({ aiExplanation: Boolean(c.env.ARK_API_KEY) }))

app.get('/api/characters/:char/explanation', async (c) => {
  if (!c.env.ARK_API_KEY) return c.json({ error: 'AI explanation is not configured' }, 503)
  const char = c.req.param('char')
  if ([...char].length !== 1) return c.json({ error: 'unknown character' }, 404)

  // missing assets fall back to index.html, so check the content type
  const asset = await c.env.ASSETS.fetch(new URL(`/data/chars/${char.codePointAt(0).toString(16)}.json`, c.req.url))
  if (!asset.ok || !asset.headers.get('content-type')?.includes('json')) return c.json({ error: 'unknown character' }, 404)

  const cached = await c.env.EXPLANATIONS.get(char, 'json')
  if (cached) return c.json(cached)

  try {
    const result = await explainCharacter(await asset.json(), c.env)
    await c.env.EXPLANATIONS.put(char, JSON.stringify(result))
    return c.json(result)
  } catch (err) {
    console.error(`explain ${char} failed:`, err.message)
    return c.json({ error: 'explanation failed' }, 502)
  }
})

export default app
