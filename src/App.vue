<script setup>
import { useProgress } from './composables/useProgress.js'

const { learnedCount, avatar } = useProgress()
</script>

<template>
  <div class="mx-auto min-h-dvh max-w-5xl px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
    <header class="mb-4 flex items-center justify-between gap-3">
      <RouterLink to="/" class="flex items-center gap-2 text-2xl font-black">
        <img src="/icons/icon.svg" class="size-10" alt="" />
        <span>小墨识字</span>
      </RouterLink>
      <nav class="flex items-center gap-2">
        <RouterLink to="/notebook" class="btn bg-white py-1 pl-1 shadow-sm" active-class="!bg-sun">
          <img :src="avatar.avatar" class="size-10" :alt="avatar.name" />
          <span>生字本</span>
          <span class="rounded-full bg-berry px-2 text-base text-white">{{ learnedCount }}</span>
        </RouterLink>
      </nav>
    </header>
    <RouterView />
  </div>
</template>
