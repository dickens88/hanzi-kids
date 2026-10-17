<script setup>
defineProps({
  message: { type: String, required: true },
})
</script>

<template>
  <div class="flex items-center gap-3">
    <span :key="message" class="animate-wiggle text-6xl drop-shadow-sm" aria-hidden="true">🐼</span>
    <p :key="message" class="animate-bounce-in relative rounded-3xl bg-white px-5 py-3 text-xl font-bold shadow-sm before:absolute before:top-1/2 before:-left-2 before:size-4 before:-translate-y-1/2 before:rotate-45 before:bg-white">
      {{ message }}
    </p>
  </div>
</template>
