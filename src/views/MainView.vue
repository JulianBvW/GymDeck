<script setup lang="ts">
import { ref, computed } from 'vue'
import CardStack from '@/components/CardStack.vue'

const cardStackRef = ref()
const isSwiping = computed(() => cardStackRef.value?.isSwiping ?? false)
</script>

<template>
  <div class="h-full flex items-center justify-center">
    <CardStack ref="cardStackRef" />
  </div>
</template>
