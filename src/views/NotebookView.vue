<script setup>
import { useRouter } from 'vue-router'
import MascotBubble from '../components/common/MascotBubble.vue'
import StarRating from '../components/common/StarRating.vue'
import { useProgress } from '../composables/useProgress.js'
import { LEVELS } from '../utils/levels.js'
import { stickerFor } from '../utils/stickers.js'

const router = useRouter()
const { learned, learnedCount, streak, level, avatar, chooseAvatar } = useProgress()

// picks a random character among the lowest-starred ones
function review() {
  const min = Math.min(...learned.value.map((l) => l.stars))
  const pool = learned.value.filter((l) => l.stars === min)
  router.push({ path: '/', query: { c: pool[Math.floor(Math.random() * pool.length)].char } })
}

const nextLevel = () => LEVELS[level.value.level]
const levelPercent = () => {
  const next = nextLevel()
  return next ? ((learnedCount.value - level.value.count) / (next.count - level.value.count)) * 100 : 100
}
</script>

<template>
  <div class="space-y-5">
    <MascotBubble :message="learnedCount ? `你已经学会 ${learnedCount} 个字啦！` : '生字本还是空的，快去学第一个字吧！'" />

    <section class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="card text-center">
        <p class="text-4xl font-black text-berry">{{ learnedCount }}</p>
        <p class="text-lg">学会的字</p>
      </div>
      <div class="card text-center">
        <p class="text-4xl font-black text-sun-dark">🔥 {{ streak }}</p>
        <p class="text-lg">连续天数</p>
      </div>
      <div class="card col-span-2 flex items-center gap-4">
        <img :src="avatar.avatar" class="size-20 shrink-0" alt="" />
        <div class="min-w-0 flex-1">
          <p class="text-xl font-black">Lv{{ level.level }} {{ level.name }}</p>
          <div class="my-2 h-3 overflow-hidden rounded-full bg-cream">
            <div class="h-full rounded-full bg-berry transition-all" :style="{ width: `${levelPercent()}%` }" />
          </div>
          <p v-if="nextLevel()" class="text-sm">
            再学 <b class="text-berry">{{ nextLevel().count - learnedCount }}</b> 个字，变成「{{ nextLevel().name }}」
          </p>
          <p v-else class="text-sm font-bold text-sun-dark">已经是最高级啦！</p>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="mb-1 flex items-center gap-2 text-2xl font-black text-grape">
        <span class="material-symbols-rounded">cruelty_free</span>我的兔子
      </h2>
      <p class="mb-4 text-gray-500">每升一级就能解锁一只新兔子，点一下换头像</p>
      <div class="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-10">
        <button
          v-for="l in LEVELS"
          :key="l.level"
          class="flex flex-col items-center rounded-2xl p-1 transition active:scale-95"
          :class="l.level === avatar.level ? 'bg-sun/40 ring-4 ring-sun' : ''"
          :disabled="l.level > level.level"
          @click="chooseAvatar(l.level)"
        >
          <span class="relative">
            <img :src="l.avatar" class="w-full" :class="l.level > level.level && 'opacity-30 grayscale'" alt="" />
            <span v-if="l.level > level.level" class="material-symbols-rounded absolute inset-0 m-auto size-fit text-3xl text-gray-500">lock</span>
          </span>
          <span class="mt-1 text-xs font-bold">{{ l.level > level.level ? `${l.count} 字` : l.name }}</span>
        </button>
      </div>
    </section>

    <section class="card">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-2xl font-black text-grape">
          <span class="material-symbols-rounded">collections_bookmark</span>我的贴纸墙
        </h2>
        <button v-if="learnedCount" class="btn bg-grape text-white" @click="review">
          <span class="material-symbols-rounded">shuffle</span>复习一下
        </button>
      </div>
      <div v-if="learnedCount" class="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
        <RouterLink
          v-for="l in learned"
          :key="l.char"
          :to="{ path: '/', query: { c: l.char } }"
          class="relative flex flex-col items-center rounded-2xl bg-cream p-3 transition active:scale-95"
        >
          <span class="absolute -right-1 -top-2 text-3xl">{{ stickerFor(l.char) }}</span>
          <span class="font-kai text-5xl">{{ l.char }}</span>
          <StarRating :stars="l.stars" size="text-xl" />
        </RouterLink>
      </div>
      <p v-else class="py-8 text-center text-xl text-gray-400">在「我来写」里写完一个字，就能得到一张贴纸哦</p>
    </section>
  </div>
</template>
