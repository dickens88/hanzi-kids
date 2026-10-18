<script setup>
import { computed, ref, watch } from 'vue'
import StarRating from '../common/StarRating.vue'
import { useProgress } from '../../composables/useProgress.js'
import { lessonLabel, useTextbook } from '../../composables/useTextbook.js'

const { starsFor } = useProgress()
const { books, bookId, book, currentLesson } = useTextbook()

// a lesson picked by hand overrides the suggested one until the book changes
const pickedId = ref(null)
watch(bookId, () => (pickedId.value = null))

const lesson = computed(() => book.value?.lessons.find((l) => l.id === pickedId.value) || currentLesson.value || book.value?.lessons[0] || null)
const allDone = computed(() => book.value && !currentLesson.value)
const selectClass = 'min-h-12 min-w-0 rounded-2xl border-4 border-sun/50 bg-cream px-3 text-lg font-bold outline-none focus:border-sun'
</script>

<template>
  <section class="card">
    <h2 class="mb-3 flex items-center gap-2 text-2xl font-black text-grape">
      <span class="material-symbols-rounded">auto_stories</span>课本生字
    </h2>
    <div v-if="book" class="mb-4 flex flex-wrap gap-3">
      <select v-model="bookId" :class="selectClass" aria-label="选择课本">
        <option v-for="b in books" :key="b.id" :value="b.id">{{ b.name }}</option>
      </select>
      <select :value="lesson?.id" :class="[selectClass, 'flex-1']" aria-label="选择课文" @change="pickedId = $event.target.value">
        <option v-for="l in book.lessons" :key="l.id" :value="l.id">
          {{ lessonLabel(l) }}{{ l.id === currentLesson?.id ? '（接着学）' : '' }}
        </option>
      </select>
    </div>
    <p v-if="allDone" class="mb-4 rounded-2xl bg-leaf/15 p-3 text-lg font-bold text-leaf">这一册的字都写过啦！可以换下一册继续学。</p>

    <template v-if="lesson">
      <template v-if="lesson.xiezi.length">
        <h3 class="mb-2 text-lg font-bold text-berry">写一写</h3>
        <div class="mb-4 grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
          <RouterLink
            v-for="c in lesson.xiezi"
            :key="c"
            :to="{ query: { c } }"
            class="tian-grid font-kai flex aspect-square flex-col items-center justify-center rounded-2xl text-5xl transition active:scale-95"
          >
            {{ c }}
            <StarRating v-if="starsFor(c)" :stars="starsFor(c)" size="text-sm" />
          </RouterLink>
        </div>
      </template>
      <template v-if="lesson.shizi.length">
        <h3 class="mb-2 text-lg font-bold text-sky">认一认</h3>
        <div class="flex flex-wrap gap-2">
          <RouterLink
            v-for="c in lesson.shizi"
            :key="c"
            :to="{ query: { c } }"
            class="font-kai flex size-14 items-center justify-center rounded-xl bg-sky/10 text-3xl transition active:scale-95"
          >
            {{ c }}
          </RouterLink>
        </div>
      </template>
    </template>
  </section>
</template>
