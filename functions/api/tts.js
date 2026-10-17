// Doubao text-to-speech (Volcengine), proxied through a Pages Function: the TTS endpoint's
// CORS rules don't allow the X-Api-Key header, so the browser can't call it directly
const ENDPOINT = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'
const DEFAULT_VOICE = 'zh_female_xiaoxue_uranus_bigtts' // 儿童绘本 2.0
const MAX_LENGTH = 120

// The reply is a stream of JSON objects, each carrying a base64 slice of the mp3
function parseAudio(body) {
  const chunks = []
  for (const part of body.trim().split(/(?<=\})\s*(?=\{)/)) {
    const msg = JSON.parse(part)
    if (msg.code === 0 && msg.data) chunks.push(Uint8Array.from(atob(msg.data), (c) => c.charCodeAt(0)))
    else if (msg.code !== 0 && msg.code !== 20000000) throw new Error(`${msg.code} ${msg.message}`)
  }
  if (!chunks.length) throw new Error('no audio in reply')
  const audio = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
  let offset = 0
  for (const c of chunks) {
    audio.set(c, offset)
    offset += c.length
  }
  return audio
}

export async function onRequestGet({ request, env, waitUntil }) {
  if (!env.TTS_API_KEY) return new Response('TTS is not configured', { status: 503 })
  const text = new URL(request.url).searchParams.get('text')?.trim()
  if (!text || [...text].length > MAX_LENGTH) return new Response('bad text', { status: 400 })

  const voice = env.TTS_VOICE || DEFAULT_VOICE
  const cacheKey = new Request(`https://tts.cache/${voice}/${encodeURIComponent(text)}`)
  const cached = await caches.default.match(cacheKey)
  if (cached) return cached

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'X-Api-Key': env.TTS_API_KEY,
        'X-Api-Resource-Id': 'seed-tts-2.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: { uid: 'hanzi-kids' },
        req_params: {
          text,
          speaker: voice,
          audio_params: { format: 'mp3', sample_rate: 24000, speech_rate: -10 },
        },
      }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`)
    const response = new Response(parseAudio(await res.text()), {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=2592000' },
    })
    waitUntil(caches.default.put(cacheKey, response.clone()))
    return response
  } catch (err) {
    console.error(`tts "${text}" failed:`, err.message)
    return new Response('tts failed', { status: 502 })
  }
}
