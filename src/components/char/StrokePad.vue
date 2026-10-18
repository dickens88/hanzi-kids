<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import HanziWriter from 'hanzi-writer'
import { loadStrokes } from '../../composables/useDict.js'
import { playCorrect, playMistake } from '../../utils/sound.js'

const props = defineProps({
  char: { type: String, required: true },
})
const emit = defineEmits(['complete', 'mistake', 'correct'])

const target = ref(null)
const mode = ref('idle')
const step = ref(0)
const total = ref(0)
const busy = ref(false)
let writer = null

const size = () => Math.min(target.value?.clientWidth || 320, 420)

function create() {
  writer?.cancelQuiz()
  target.value.innerHTML = ''
  writer = HanziWriter.create(target.value, props.char, {
    width: size(),
    height: size(),
    padding: 12,
    showOutline: true,
    strokeColor: '#3b2f2f',
    radicalColor: '#e57373',
    outlineColor: '#e8dccb',
    highlightColor: '#66bb6a',
    drawingColor: '#4fc3f7',
    drawingWidth: 24,
    strokeAnimationSpeed: 0.8,
    delayBetweenStrokes: 400,
    charDataLoader: (char, onLoad, onError) => {
      loadStrokes(char).then(onLoad, onError)
    },
  })
  writer.getCharacterData().then((data) => (total.value = data.strokes.length))
}

async function animate() {
  mode.value = 'animate'
  writer.cancelQuiz()
  busy.value = true
  await writer.animateCharacter()
  busy.value = false
}

async function nextStep() {
  busy.value = true
  if (mode.value !== 'step' || step.value >= total.value) {
    mode.value = 'step'
    writer.cancelQuiz()
    await writer.hideCharacter({ duration: 0 })
    step.value = 0
  }
  await writer.animateStroke(step.value)
  step.value++
  busy.value = false
}

function startQuiz() {
  mode.value = 'quiz'
  step.value = 0
  writer.quiz({
    leniency: 1.4,
    showHintAfterMisses: 2,
    onCorrectStroke: (d) => {
      step.value = d.strokeNum + 1
      playCorrect()
      emit('correct')
    },
    onMistake: () => {
      playMistake()
      emit('mistake')
    },
    onComplete: ({ totalMistakes }) => {
      const stars = totalMistakes === 0 ? 3 : totalMistakes <= 3 ? 2 : 1
      emit('complete', stars)
    },
  })
}

watch(
  () => props.char,
  () => {
    mode.value = 'idle'
    step.value = 0
    create()
  },
)

onMounted(create)
onBeforeUnmount(() => writer?.cancelQuiz())

defineExpose({ startQuiz })
</script>

<template>
  <section class="card flex flex-col items-center">
    <h2 class="mb-3 flex items-center gap-2 self-start text-2xl font-black text-berry">
      <span class="material-symbols-rounded">draw</span>写一写
    </h2>
    <div ref="target" class="tian-grid aspect-square w-full max-w-[420px] touch-none rounded-2xl"></div>
    <p class="mt-3 h-8 text-xl font-bold">
      <template v-if="mode === 'step'">第 {{ step }} / {{ total }} 笔</template>
      <template v-else-if="mode === 'quiz'">跟着描一描：{{ step }} / {{ total }} 笔</template>
      <template v-else>一共 {{ total }} 笔</template>
    </p>
    <div class="mt-3 grid w-full max-w-[420px] grid-cols-3 gap-3 [&>button]:px-2 [&>button]:whitespace-nowrap">
      <button class="btn bg-sky text-white" :class="mode === 'animate' && 'ring-4 ring-sky/40'" :disabled="busy" @click="animate">
        <span class="material-symbols-rounded">play_circle</span>看动画
      </button>
      <button class="btn bg-grape text-white" :class="mode === 'step' && 'ring-4 ring-grape/40'" :disabled="busy" @click="nextStep">
        <span class="material-symbols-rounded">footprint</span>{{ mode !== 'step' ? '一笔一笔' : step < total ? '下一笔' : '再来一遍' }}
      </button>
      <button class="btn bg-berry text-white" :class="mode === 'quiz' && 'ring-4 ring-berry/40'" @click="startQuiz">
        <span class="material-symbols-rounded">edit</span>我来写
      </button>
    </div>
  </section>
</template>
