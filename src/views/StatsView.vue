<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDown } from 'lucide-vue-next'
import WaveBackground from '@/components/WaveBackground.vue'
import WeekHeatmap from '@/components/WeekHeatmap.vue'
import WeightChart from '@/components/WeightChart.vue'
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
  { value: sessionsStore.currentStreak, unit: 'weeks', label: 'STREAK' },
  { value: sessionsStore.totalSessions, unit: '/ 52w', label: 'SESSIONS' },
  { value: Math.round(machinesStore.totalWeight), unit: 'kg', label: 'VOLUME' },
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

    <div class="relative z-10 flex-1 overflow-y-auto pt-4 pb-8 px-5 flex flex-col gap-6">
      <!-- Header + page title -->
      <div class="flex flex-col gap-0 cursor-pointer touch-manipulation" @click="goBack">
        <div class="flex items-center justify-between">
          <span class="font-semibold tracking-widest text-[10px] text-gray-600 uppercase">Statistics</span>
          <div class="w-9 h-9 flex items-center justify-center text-gray-500 rounded-full">
            <ChevronDown :size="22" />
          </div>
        </div>
        <h1 class="-mt-2 text-2xl font-bold text-gray-900">Your progress</h1>
      </div>

      <!-- Quick stats row -->
      <div class="flex gap-3">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="flex-1 bg-white rounded-2xl shadow-sm px-4 py-3 flex flex-col gap-1"
        >
          <span class="text-[10px] font-semibold tracking-widest text-gray-400">{{
            stat.label
          }}</span>
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-bold text-gray-900">{{ stat.value }}</span>
            <span class="text-sm text-gray-400">{{ stat.unit }}</span>
          </div>
        </div>
      </div>

      <!-- Week heatmap -->
      <WeekHeatmap />

      <!-- Per-machine weight charts -->
      <div>
        <p class="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2 px-1">
          Weight evolution
        </p>
        <div class="flex flex-col gap-3">
          <WeightChart
            v-for="machine in machinesStore.machines"
            :key="machine.id"
            :machine-id="machine.id"
            :machine-name="machine.name"
          />
        </div>
      </div>
    </div>
  </div>
</template>
