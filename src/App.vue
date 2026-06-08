<script setup lang="ts">
import '@/assets/main.css'
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useDailyPalette } from '@/composables/useDailyPalette'

const uiStore = useUIStore()
const route = useRoute()
const palette = useDailyPalette()

// iOS paints body.backgroundColor over the home-indicator safe-area when
// apple-mobile-web-app-status-bar-style is "black-translucent". We compute
// the blended wave color at y=100% (the three gradient layers at 0.35 opacity
// each, stacked over cream) and set body background to match, so the iOS
// overlay is visually seamless with the wave content above it.
// Flip views (/stats, /fitness) have no wave at the bottom → use cream.
const CREAM: [number, number, number] = [250, 249, 247]

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function blendOver(fg: [number, number, number], alpha: number, bg: [number, number, number]): [number, number, number] {
  return [
    Math.round(alpha * fg[0] + (1 - alpha) * bg[0]),
    Math.round(alpha * fg[1] + (1 - alpha) * bg[1]),
    Math.round(alpha * fg[2] + (1 - alpha) * bg[2]),
  ]
}

watch(
  [() => route.path, palette],
  ([path, pal]) => {
    const isFlip = path === '/stats' || path === '/fitness'
    if (isFlip) {
      document.body.style.backgroundColor = '#faf9f7'
    } else {
      // Stack all 3 wave layers at stop-opacity 0.35 over cream (matches gradient bottom stop)
      const step1 = blendOver(parseHex(pal.wave1), 0.35, CREAM)
      const step2 = blendOver(parseHex(pal.wave2), 0.35, step1)
      const step3 = blendOver(parseHex(pal.wave3), 0.35, step2)
      document.body.style.backgroundColor = `rgb(${step3[0]},${step3[1]},${step3[2]})`
    }
  },
  { immediate: true },
)
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition :name="`slide-${uiStore.transitionDirection}`">
      <component :is="Component" :key="$route.path" />
    </Transition>
  </RouterView>
</template>
