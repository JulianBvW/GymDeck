<script setup lang="ts">
import '@/assets/main.css'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition :name="`slide-${uiStore.transitionDirection}`">
      <component :is="Component" :key="$route.path" />
    </Transition>
  </RouterView>
</template>
