import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import { PALETTES } from '@/assets/palettes'

function todayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function useDailyPalette() {
  const uiStore = useUIStore()

  const today = todayString()
  if (uiStore.dailyPaletteDate !== today) {
    uiStore.dailyPaletteIndex = Math.floor(Math.random() * PALETTES.length)
    uiStore.dailyPaletteDate = today
  }

  return computed(() => PALETTES[uiStore.dailyPaletteIndex] ?? PALETTES[0]!)
}
