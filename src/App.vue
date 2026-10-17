<script setup>
import { useProgress } from './composables/useProgress.js'

const { learnedCount, streak } = useProgress()
</script>

<template>
  <div class="mx-auto min-h-dvh max-w-5xl px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
    <header class="mb-4 flex items-center justify-between gap-3">
      <RouterLink to="/" class="flex items-center gap-2 text-2xl font-black">
        <span class="text-4xl">🐼</span>
        <span>小墨识字</span>
      </RouterLink>
      <nav class="flex items-center gap-2">
        <span v-if="streak > 0" class="rounded-full bg-white px-3 py-2 text-lg font-bold shadow-sm" title="连续学习天数">🔥 {{ streak }} 天</span>
        <RouterLink to="/notebook" class="btn bg-white shadow-sm" active-class="!bg-sun">
          <span class="material-symbols-rounded">menu_book</span>
          <span>生字本</span>
          <span class="rounded-full bg-berry px-2 text-base text-white">{{ learnedCount }}</span>
        </RouterLink>
      </nav>
    </header>
    <RouterView />
  </div>
</template>
