<script setup>
import { ref, watch } from 'vue'
import { useSpeech } from '../../composables/useSpeech.js'
import { useExplanations } from '../../composables/useExplanations.js'
import { useProgress } from '../../composables/useProgress.js'

const props = defineProps({
  entry: { type: Object, required: true },
})

const loading = ref(false)
const failed = ref(false)
const result = ref(null)
const { speak } = useSpeech()
const { explain } = useExplanations()
const { avatar } = useProgress()

watch(
  () => props.entry.char,
  () => {
    result.value = null
    failed.value = false
  },
)

async function ask() {
  const char = props.entry.char
  loading.value = true
  failed.value = false
  try {
    const explanation = await explain(char)
    if (char !== props.entry.char) return
    result.value = explanation
    speak(`${explanation.meaning}${explanation.sentence}`)
  } catch (err) {
    console.warn('AI explanation failed:', err)
    failed.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="card bg-gradient-to-br from-white to-sun/20">
    <button v-if="!result" class="btn w-full bg-sun text-ink" :disabled="loading" @click="ask">
      <span class="material-symbols-rounded" :class="loading && 'animate-spin'">{{ loading ? 'progress_activity' : 'auto_awesome' }}</span>
      {{ loading ? '小墨想一想…' : '小墨讲给你听' }}
    </button>
    <p v-if="failed" class="mt-2 text-center text-lg text-berry">小墨有点累了，等一下再试试吧～</p>
    <div v-if="result" class="animate-bounce-in space-y-3 text-xl leading-relaxed">
      <p><img :src="avatar.avatar" class="mr-2 inline size-8 align-middle" alt="" />{{ result.meaning }}</p>
      <p class="rounded-2xl bg-white/70 p-3"><b class="text-grape">记一记：</b>{{ result.memoryTip }}</p>
      <p class="rounded-2xl bg-white/70 p-3"><b class="text-leaf">说一说：</b>{{ result.sentence }}</p>
      <button class="btn min-h-12 bg-white text-base" @click="speak(`${result.meaning}${result.sentence}`)">
        <span class="material-symbols-rounded">volume_up</span>再听一遍
      </button>
    </div>
  </section>
</template>
