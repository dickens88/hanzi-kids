// Volcengine Ark (Doubao) chat completions, called from the Pages Function so the key stays on Cloudflare
const ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
export const DEFAULT_MODEL = 'doubao-seed-2-1-lite-260915'
const FIELDS = ['meaning', 'memoryTip', 'sentence']

const SYSTEM = `你是「小墨」，一个温柔、有趣的小老师，正在教一个 9 岁的小学生认识汉字。
要求：
- 用小学三年级孩子能听懂的简单口语，积极、温暖，不吓人，不涉及成人话题。
- meaning：用一两句话讲清楚这个字最常用的意思（不超过 40 个字）。如果是多音字，讲最常用的读音。
- memoryTip：根据字形（偏旁、部件）编一个帮助记忆的小窍门或小故事（不超过 50 个字），要符合字形，不要胡编笔画。
- sentence：一句包含这个字的简单例句，贴近孩子的生活（不超过 25 个字）。
只用简体中文。只输出一个 JSON 对象，不要输出其他内容，格式：
{"meaning": "...", "memoryTip": "...", "sentence": "..."}`

// Pulls the JSON object out of the reply and checks every field is a non-empty string.
export function parseExplanation(text) {
  const obj = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
  for (const key of FIELDS) {
    if (typeof obj[key] !== 'string' || !obj[key].trim()) throw new Error(`reply is missing ${key}`)
  }
  return Object.fromEntries(FIELDS.map((key) => [key, obj[key].trim()]))
}

export async function explainCharacter(entry, { apiKey, model }) {
  const readings = entry.readings.map((r) => `${r.pinyin}：${r.meanings.join('；') || '（无）'}`).join('\n')
  const words = entry.words.map((w) => w.word).join('、')
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      thinking: { type: 'disabled' },
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `请讲解汉字「${entry.char}」。\n部首：${entry.radical}，笔画：${entry.strokes}\n字典释义：\n${readings}\n常用词：${words || '（无）'}`,
        },
      ],
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  return parseExplanation(data.choices?.[0]?.message?.content || '')
}
