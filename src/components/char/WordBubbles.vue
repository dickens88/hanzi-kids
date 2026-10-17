<script setup>
import { computed, ref } from 'vue'
import { useSpeech } from '../../composables/useSpeech.js'

const props = defineProps({
  char: { type: String, required: true },
  words: { type: Array, required: true },
  readings: { type: Array, required: true },
})

const COLORS = ['bg-berry', 'bg-sky', 'bg-leaf', 'bg-grape', 'bg-sun-dark']
const { speak } = useSpeech()
const active = ref(null)

const bubbles = computed(() =>
  props.words.map((w, i) => {
    const syllables = w.pinyin.split(' ')
    return { ...w, color: COLORS[i % COLORS.length], parts: [...w.word].map((c, j) => ({ c, py: syllables[j] || '', hit: c === props.char })) }
  }),
)

// polyphones get one row per reading
const groups = computed(() => {
  if (props.readings.length < 2) return [{ pinyin: null, items: bubbles.value }]
  return props.readings
    .map((r) => ({ pinyin: r.pinyin, items: bubbles.value.filter((w) => w.reading === r.pinyin) }))
    .filter((g) => g.items.length)
})

function tap(w) {
  active.value = w.word
  speak(w.word)
}
</script>

<template>
  <section class="card">
    <h2 class="mb-3 flex items-center gap-2 text-2xl font-black text-leaf">
      <span class="material-symbols-rounded">bubble_chart</span>组一组
    </h2>
    <p v-if="!bubbles.length" class="text-lg text-gray-500">这个字很少组词，先把它写好吧！</p>
    <div v-for="g in groups" :key="g.pinyin" class="mb-3 flex flex-wrap items-center gap-3 last:mb-0">
      <span v-if="g.pinyin" class="rounded-full bg-cream px-3 py-1 text-lg font-bold text-sky">{{ g.pinyin }}</span>
      <button
        v-for="w in g.items"
        :key="w.word"
        class="rounded-full px-5 py-2 text-white shadow-[0_4px_0_rgba(0,0,0,0.15)] transition active:translate-y-1 active:shadow-none"
        :class="[w.color, active === w.word && 'ring-4 ring-sun']"
        @click="tap(w)"
      >
        <span class="flex gap-1">
          <ruby v-for="(p, j) in w.parts" :key="j" class="font-kai text-3xl" :class="p.hit && 'rounded-lg bg-white/30 px-1'">
            {{ p.c }}<rt class="font-sans text-sm opacity-90">{{ p.py }}</rt>
          </ruby>
        </span>
      </button>
    </div>
  </section>
</template>
