<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import confetti from 'canvas-confetti'
import MascotBubble from '../components/common/MascotBubble.vue'
import StarRating from '../components/common/StarRating.vue'
import CharInfo from '../components/char/CharInfo.vue'
import WordBubbles from '../components/char/WordBubbles.vue'
import StrokePad from '../components/char/StrokePad.vue'
import AiExplain from '../components/char/AiExplain.vue'
import TextbookLessons from '../components/textbook/TextbookLessons.vue'
import { loadChar } from '../composables/useDict.js'
import { useProgress } from '../composables/useProgress.js'
import { useTextbook } from '../composables/useTextbook.js'
import { lastHanzi } from '../utils/hanzi.js'
import { stickerFor } from '../utils/stickers.js'
import { playFanfare } from '../utils/sound.js'

const CHEERS = ['写得真棒！', '你真厉害！', '太漂亮啦！', '小墨为你鼓掌！']
const ENCOURAGE = ['再试一次～', '别着急，慢慢来～', '看看绿色的提示哦～']

const route = useRoute()
const router = useRouter()
const { record } = useProgress()
const { nextChar } = useTextbook()

const input = ref('')
const entry = ref(null)
const notFound = ref(false)
const message = ref('嗨！我是小墨，输入一个字，我们一起学吧！')
const result = ref(null)
const pad = ref(null)

const char = computed(() => (typeof route.query.c === 'string' ? lastHanzi(route.query.c) : null))
const pick = (list) => list[Math.floor(Math.random() * list.length)]

watch(
  char,
  async (c) => {
    result.value = null
    notFound.value = false
    input.value = c || ''
    if (!c) {
      entry.value = null
      return
    }
    const data = await loadChar(c)
    if (c !== char.value) return
    entry.value = data
    notFound.value = !data
    message.value = data ? `这是「${c}」字，先看看它怎么写吧！` : `「${c}」这个字小墨还不认识哦，换一个试试？`
  },
  { immediate: true },
)

watch(input, (text) => {
  const c = lastHanzi(text)
  if (c && c !== char.value) router.push({ query: { c } })
})

function onComplete(stars) {
  const { isNew, badge } = record(entry.value.char, stars)
  result.value = { stars, isNew, badge, sticker: stickerFor(entry.value.char), next: nextChar(entry.value.char) }
  message.value = pick(CHEERS)
  playFanfare()
  confetti({ particleCount: 60 + stars * 40, spread: 80, origin: { y: 0.6 } })
}

async function practiceAgain() {
  result.value = null
  await nextTick()
  pad.value.startQuiz()
}
</script>

<template>
  <div class="space-y-5">
    <MascotBubble :message="message" />

    <div class="card flex items-center gap-3">
      <span class="material-symbols-rounded text-4xl text-sun-dark">search</span>
      <input
        v-model="input"
        class="font-kai min-w-0 flex-1 rounded-2xl border-4 border-sun/50 bg-cream px-4 py-2 text-4xl outline-none focus:border-sun"
        placeholder="写一个字"
        enterkeyhint="search"
        autocomplete="off"
      />
    </div>

    <template v-if="entry">
      <div class="grid items-start gap-5 lg:grid-cols-2">
        <StrokePad ref="pad" :char="entry.char" @complete="onComplete" @mistake="message = pick(ENCOURAGE)" />
        <div class="space-y-5">
          <CharInfo :entry="entry" />
          <WordBubbles :char="entry.char" :words="entry.words" :readings="entry.readings" />
          <AiExplain :entry="entry" />
        </div>
      </div>
    </template>

    <TextbookLessons v-if="!entry || notFound" />

    <Transition enter-from-class="opacity-0" enter-active-class="transition">
      <div v-if="result" class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" @click.self="result = null">
        <div class="card animate-bounce-in w-full max-w-sm text-center">
          <p class="text-7xl">{{ result.sticker }}</p>
          <p class="mt-2 text-3xl font-black">{{ result.isNew ? '获得新贴纸！' : '又写好一次！' }}</p>
          <StarRating :stars="result.stars" size="text-5xl" class="my-3" />
          <p v-if="result.badge" class="mb-3 rounded-2xl bg-sun/20 p-3 text-xl font-bold">
            {{ result.badge.emoji }} 解锁徽章「{{ result.badge.name }}」
          </p>
          <div class="grid grid-cols-2 gap-3">
            <button class="btn bg-berry text-white" @click="practiceAgain">
              <span class="material-symbols-rounded">replay</span>再写一次
            </button>
            <button class="btn bg-leaf text-white" @click="router.push({ query: result.next ? { c: result.next } : {} })">
              <span class="material-symbols-rounded">{{ result.next ? 'arrow_forward' : 'add' }}</span>{{ result.next ? `下一个「${result.next}」` : '学新字' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
