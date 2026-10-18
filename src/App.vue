<script setup>
import { useProgress } from './composables/useProgress.js'

const { learnedCount } = useProgress()
</script>

<template>
  <div class="mx-auto min-h-dvh max-w-5xl px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
    <header class="mb-4 flex items-center justify-between gap-3">
      <RouterLink to="/" class="flex items-center gap-2 text-2xl font-black">
        <img src="/icons/icon.svg" class="size-10" alt="" />
        <span>小墨识字</span>
      </RouterLink>
      <nav class="flex items-center gap-2">
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
