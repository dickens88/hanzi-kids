<script setup>
import { useSpeech } from '../../composables/useSpeech.js'

const props = defineProps({
  entry: { type: Object, required: true },
})

const { supported, speak } = useSpeech()

// a lone character is read with its default reading, so use a word for the others
const speechFor = (r, i) => (i === 0 ? props.entry.char : props.entry.words.find((w) => w.reading === r.pinyin)?.word || props.entry.char)
</script>

<template>
  <section class="card">
    <h2 class="mb-3 flex items-center gap-2 text-2xl font-black text-sky">
      <span class="material-symbols-rounded">visibility</span>认一认
    </h2>
    <div class="mb-4 flex flex-wrap gap-2 text-lg">
      <span class="rounded-full bg-cream px-4 py-1">部首：<b class="font-kai text-2xl">{{ entry.radical }}</b></span>
      <span class="rounded-full bg-cream px-4 py-1">笔画：<b>{{ entry.strokes }}</b> 画</span>
      <span v-if="entry.readings.length > 1" class="rounded-full bg-berry/15 px-4 py-1 font-bold text-berry">多音字</span>
    </div>
    <div v-for="(r, i) in entry.readings" :key="r.pinyin" class="mb-3 last:mb-0">
      <button class="btn min-h-12 bg-sky/15 px-4 text-2xl text-sky" :disabled="!supported" @click="speak(speechFor(r, i))">
        <span class="material-symbols-rounded">volume_up</span>{{ r.pinyin }}
      </button>
      <ol v-if="r.meanings.length" class="mt-2 space-y-1 pl-2 text-xl leading-relaxed">
        <li v-for="(m, j) in r.meanings" :key="m" class="flex gap-2">
          <span class="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-sun text-base font-bold text-white">{{ j + 1 }}</span>
          <span>{{ m }}</span>
        </li>
      </ol>
    </div>
  </section>
</template>
