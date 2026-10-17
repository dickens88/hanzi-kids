import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'

const MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-5-5'

const SYSTEM = `你是「小墨」，一只温柔、有趣的小熊猫老师，正在教一个 9 岁的小学生认识汉字。
要求：
- 用小学三年级孩子能听懂的简单口语，积极、温暖，不吓人，不涉及成人话题。
- meaning：用一两句话讲清楚这个字最常用的意思（不超过 40 个字）。如果是多音字，讲最常用的读音。
- memoryTip：根据字形（偏旁、部件）编一个帮助记忆的小窍门或小故事（不超过 50 个字），要符合字形，不要胡编笔画。
- sentence：一句包含这个字的简单例句，贴近孩子的生活（不超过 25 个字）。
只用简体中文。`

const Explanation = z.object({
  meaning: z.string(),
  memoryTip: z.string(),
  sentence: z.string(),
})

let client = null

export async function explainCharacter(entry) {
  client ??= new Anthropic()
  const readings = entry.readings.map((r) => `${r.pinyin}：${r.meanings.join('；') || '（无）'}`).join('\n')
  const words = entry.words.map((w) => w.word).join('、')
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: 'low', format: zodOutputFormat(Explanation) },
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `请讲解汉字「${entry.char}」。\n部首：${entry.radical}，笔画：${entry.strokes}\n字典释义：\n${readings}\n常用词：${words || '（无）'}`,
      },
    ],
  })
  if (response.stop_reason === 'refusal') throw new Error(`refused: ${response.stop_details?.category}`)
  if (!response.parsed_output) throw new Error(`no parsed output (stop_reason: ${response.stop_reason})`)
  return response.parsed_output
}
