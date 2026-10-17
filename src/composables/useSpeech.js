let voice = null

function pickVoice() {
  const voices = window.speechSynthesis?.getVoices() || []
  voice = voices.find((v) => v.lang === 'zh-CN') || voices.find((v) => v.lang.startsWith('zh')) || null
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  pickVoice()
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice)
}

export function useSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  function speak(text) {
    if (!supported) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'
    u.rate = 0.8
    if (voice) u.voice = voice
    window.speechSynthesis.speak(u)
  }

  return { supported, speak }
}
