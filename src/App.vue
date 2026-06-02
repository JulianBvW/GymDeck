<script setup lang="ts">
import '@/assets/main.css'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
</script>

<template>
  <Transition :name="`slide-${uiStore.transitionDirection}`">
    <RouterView :key="$route.path" />
  </Transition>
</template>
