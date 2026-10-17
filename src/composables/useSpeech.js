// Reads text aloud with the Doubao voice from /api/tts, falling back to the device's own voice
// when the cloud voice isn't set up, the network is down, or the text is too long for it
const MAX_CLOUD_LENGTH = 120
const MAX_CLIPS = 300

let voice = null

function pickVoice() {
  const voices = window.speechSynthesis?.getVoices() || []
  voice = voices.find((v) => v.lang === 'zh-CN') || voices.find((v) => v.lang.startsWith('zh')) || null
}

let ctx = null
let playing = null
let requestId = 0
let cloudOff = false
const clips = new Map() // text -> Promise<ArrayBuffer> of mp3

function audioContext() {
  if (!ctx) {
    // keep playing when the iPad is in silent mode, like a media app does
    if (navigator.audioSession) navigator.audioSession.type = 'playback'
    ctx = new AudioContext()
  }
  return ctx
}

function wakeAudio() {
  if (ctx?.state !== 'running') audioContext().resume().catch(() => {})
}

if (typeof window !== 'undefined') {
  if (window.speechSynthesis) {
    pickVoice()
    window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice)
  }
  // iOS only starts audio from a tap, and suspends it again when the app goes to the background
  for (const type of ['touchend', 'click']) window.addEventListener(type, wakeAudio, true)
}

function loadClip(text) {
  if (!clips.has(text)) {
    const clip = fetch(`/api/tts?text=${encodeURIComponent(text)}`).then((res) => {
      if (res.ok && res.headers.get('content-type')?.startsWith('audio/')) return res.arrayBuffer()
      // 503 = no API key; a non-audio 200 = no Pages Functions (e.g. the Vite dev server)
      if (res.ok || res.status === 503) cloudOff = true
      throw new Error(`tts ${res.status}`)
    })
    clip.catch(() => clips.delete(text))
    clips.set(text, clip)
    if (clips.size > MAX_CLIPS) clips.delete(clips.keys().next().value)
  }
  return clips.get(text)
}

function speakWithDevice(text) {
  if (!window.speechSynthesis) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'zh-CN'
  u.rate = 0.8
  if (voice) u.voice = voice
  window.speechSynthesis.speak(u)
}

function stop() {
  window.speechSynthesis?.cancel()
  playing?.stop()
  playing = null
}

export function useSpeech() {
  const supported = typeof window !== 'undefined' && ('AudioContext' in window || 'speechSynthesis' in window)

  async function speak(text) {
    if (!supported) return
    stop()
    const id = ++requestId
    if (cloudOff || !window.AudioContext || [...text].length > MAX_CLOUD_LENGTH) return speakWithDevice(text)
    wakeAudio()
    try {
      const buffer = await audioContext().decodeAudioData((await loadClip(text)).slice(0))
      if (id !== requestId) return // a newer tap took over
      const source = audioContext().createBufferSource()
      source.buffer = buffer
      source.connect(audioContext().destination)
      source.start()
      playing = source
    } catch (err) {
      console.warn('cloud voice failed, using the device voice:', err.message)
      if (id === requestId) speakWithDevice(text)
    }
  }

  return { supported, speak }
}
