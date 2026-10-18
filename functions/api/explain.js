// POST /api/explain {"char": "森"} → {"meaning", "memoryTip", "sentence"}
// The Ark key lives in the ARK_API_KEY secret; replies are cached per character in the EXPLANATIONS KV namespace.
import { explainCharacter } from '../../server/ark.js'

const HANZI = /^\p{Script=Han}$/u
// Bump to drop every cached reply, e.g. after changing the prompt or the model
const CACHE_VERSION = 'v1'

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } })

// Only our own pages may call this; it keeps other sites from spending the quota through visitors' browsers.
// Compares hostnames so the Vite dev server on another port can proxy to wrangler.
function fromOurPages(request) {
  try {
    return new URL(request.headers.get('Origin')).hostname === new URL(request.url).hostname
  } catch {
    return false // no Origin header, or "null"
  }
}

export async function onRequestPost({ request, env }) {
  if (!fromOurPages(request)) return json({ error: 'forbidden' }, 403)
  if (!env.ARK_API_KEY) return json({ error: 'ARK_API_KEY is not configured' }, 503)

  const char = (await request.json().catch(() => null))?.char
  if (typeof char !== 'string' || !HANZI.test(char)) return json({ error: 'expected one Chinese character' }, 400)

  const cacheKey = `${CACHE_VERSION}:${char}`
  const cached = await env.EXPLANATIONS?.get(cacheKey, 'json')
  if (cached) return json(cached)

  // The prompt is built from our own dictionary file, never from anything the caller sends
  const dict = await env.ASSETS.fetch(new URL(`/data/chars/${char.codePointAt(0).toString(16)}.json`, request.url))
  // Pages answers a missing file with index.html and a 200, so check that it really is JSON
  if (!dict.ok || !dict.headers.get('Content-Type')?.includes('json')) return json({ error: 'character not in dictionary' }, 404)

  try {
    const explanation = await explainCharacter(await dict.json(), { apiKey: env.ARK_API_KEY, model: env.ARK_MODEL })
    await env.EXPLANATIONS?.put(cacheKey, JSON.stringify(explanation))
    return json(explanation)
  } catch (err) {
    console.error(`explain ${char} failed:`, err)
    return json({ error: 'upstream model failed' }, 502)
  }
}
