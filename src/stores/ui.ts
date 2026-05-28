import { ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

export type TransitionDirection = 'up' | 'down' | 'left' | 'right'

export const useUIStore = defineStore('ui', () => {
  // Persisted: daily palette selection
  const dailyPaletteIndex = useLocalStorage<number>('gymdeck-palette-index', 0)
  const dailyPaletteDate = useLocalStorage<string>('gymdeck-palette-date', '')

  // Not persisted: navigation transition direction
  const transitionDirection = ref<TransitionDirection>('right')

  return { dailyPaletteIndex, dailyPaletteDate, transitionDirection }
})
