<script setup>
import { useProgress } from '../../composables/useProgress.js'

defineProps({
  message: { type: String, required: true },
})

const { avatar } = useProgress()
</script>

<template>
  <div class="flex items-center gap-3">
    <img :key="message" :src="avatar.avatar" class="animate-wiggle size-18 shrink-0 drop-shadow-sm" alt="" />
    <p :key="message" class="animate-bounce-in relative rounded-3xl bg-white px-5 py-3 text-xl font-bold shadow-sm before:absolute before:top-1/2 before:-left-2 before:size-4 before:-translate-y-1/2 before:rotate-45 before:bg-white">
      {{ message }}
    </p>
  </div>
</template>
