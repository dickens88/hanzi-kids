<script setup>
defineProps({
  stars: { type: Number, default: 0 },
  size: { type: String, default: 'text-3xl' },
})
</script>

<template>
  <span class="inline-flex" :class="size" :aria-label="`${stars} 颗星`">
    <span v-for="i in 3" :key="i" class="material-symbols-rounded" :class="[size, i <= stars ? 'text-sun-dark' : 'text-gray-200']">star</span>
  </span>
</template>
