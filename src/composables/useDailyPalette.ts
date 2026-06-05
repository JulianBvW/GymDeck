import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import { PALETTES } from '@/assets/palettes'
import { toDateString } from '@/utils/date'

export function useDailyPalette() {
  const uiStore = useUIStore()

  const today = toDateString(new Date())
  if (uiStore.dailyPaletteDate !== today) {
    uiStore.dailyPaletteIndex = Math.floor(Math.random() * PALETTES.length)
    uiStore.dailyPaletteDate = today
  }

  return computed(() => PALETTES[uiStore.dailyPaletteIndex] ?? PALETTES[0]!)
}
