<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDown } from 'lucide-vue-next'
import WaveBackground from '@/components/WaveBackground.vue'
import { useUIStore } from '@/stores/ui'
import { useSessionsStore } from '@/stores/sessions'
import { useMachinesStore } from '@/stores/machines'
import { useDailyPalette } from '@/composables/useDailyPalette'

const router = useRouter()
const uiStore = useUIStore()
const sessionsStore = useSessionsStore()
const machinesStore = useMachinesStore()
const palette = useDailyPalette()

const stats = computed(() => [
  { value: sessionsStore.currentStreak, label: 'week streak' },
  { value: sessionsStore.totalSessions, label: 'sessions' },
  { value: machinesStore.totalWeight + ' kg', label: 'total weight' },
])

function goBack() {
  uiStore.transitionDirection = 'down'
  router.push('/')
}
</script>

<template>
  <div class="relative h-full overflow-hidden bg-[#faf9f7] flex flex-col">
    <WaveBackground
      :progress="0.1"
      :flip="true"
      :wave1="palette.wave1"
      :wave2="palette.wave2"
      :wave3="palette.wave3"
    />

    <div class="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-4">
      <span class="font-semibold text-gray-900">Statistics</span>
      <button
        class="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-800 rounded-full"
        aria-label="Back"
        @click="goBack"
      >
        <ChevronDown :size="22" />
      </button>
    </div>

    <div class="relative z-10 flex-1 overflow-y-auto pt-16 pb-8 px-5 flex flex-col gap-6">
      <!-- Quick stats row -->
      <div class="flex gap-3">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="flex-1 bg-white rounded-2xl shadow-sm py-5 flex flex-col items-center gap-1"
        >
          <span class="text-2xl font-bold text-gray-900">{{ stat.value }}</span>
          <span class="text-xs text-gray-400 uppercase tracking-wide">{{ stat.label }}</span>
        </div>
      </div>

      <!-- Parts 3, 4 go here -->
    </div>
  </div>
</template>
