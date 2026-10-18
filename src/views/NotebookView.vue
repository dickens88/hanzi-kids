<script setup>
import { useRouter } from 'vue-router'
import MascotBubble from '../components/common/MascotBubble.vue'
import StarRating from '../components/common/StarRating.vue'
import { BADGES, useProgress } from '../composables/useProgress.js'
import { stickerFor } from '../utils/stickers.js'

const router = useRouter()
const { learned, learnedCount, streak, earnedBadges } = useProgress()

// picks a random character among the lowest-starred ones
function review() {
  const min = Math.min(...learned.value.map((l) => l.stars))
  const pool = learned.value.filter((l) => l.stars === min)
  router.push({ path: '/', query: { c: pool[Math.floor(Math.random() * pool.length)].char } })
}

const nextBadge = () => BADGES.find((b) => b.count > learnedCount.value)
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
      <div class="card col-span-2 flex items-center justify-around">
        <div v-for="b in BADGES" :key="b.count" class="text-center" :class="!earnedBadges.includes(b) && 'opacity-25 grayscale'">
          <p class="text-4xl">{{ b.emoji }}</p>
          <p class="text-sm font-bold">{{ b.name }}</p>
        </div>
      </div>
    </section>

    <p v-if="nextBadge()" class="text-center text-lg">
      再学 <b class="text-berry">{{ nextBadge().count - learnedCount }}</b> 个字，就能得到 {{ nextBadge().emoji }}「{{ nextBadge().name }}」
    </p>

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
