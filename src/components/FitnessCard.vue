<script setup lang="ts">
import { ref, computed } from 'vue'
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions, ScriptableContext } from 'chart.js'
import { Check } from 'lucide-vue-next'
import DrumRollPicker from '@/components/DrumRollPicker.vue'
import { useFitnessStore } from '@/stores/fitness'
import { useSessionsStore } from '@/stores/sessions'
import { useDailyPalette } from '@/composables/useDailyPalette'

const props = defineProps<{ checkId: string }>()

const fitnessStore = useFitnessStore()
const sessionsStore = useSessionsStore()
const palette = useDailyPalette()

const check = computed(() => fitnessStore.checks.find(c => c.id === props.checkId))

const min = computed(() => check.value?.min ?? 0)
const max = computed(() => check.value?.max ?? ((check.value?.stepSize ?? 1) < 1 ? 100 : 200))
const step = computed(() => check.value?.stepSize ?? 1)

// Picker initial value: today's saved measurement → last ever measurement → 0
const pickerValue = ref(
  fitnessStore.measurements.find(m => m.checkId === props.checkId && m.date === sessionsStore.today)?.value
  ?? [...fitnessStore.measurements]
      .filter(m => m.checkId === props.checkId)
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.value
  ?? min.value
)

// Historical points: exclude today (shown as live grey dot), last 20
const historicalPoints = computed(() =>
  fitnessStore.measurements
    .filter(m => m.checkId === props.checkId && m.date !== sessionsStore.today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-20)
    .map(m => {
      const parts = m.date.slice(5).split('-')
      const month = parts[0] ?? ''
      const day = parts[1] ?? ''
      return { x: `${day}.${month}.`, y: m.value }
    })
)

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const TODAY_COLOR = '#d1d5db'

const chartData = computed<ChartData<'line'>>(() => {
  const hist = historicalPoints.value
  const allPoints = [...hist, { x: 'Today', y: pickerValue.value }]
  const accent = palette.value.accent

  return {
    labels: allPoints.map(p => p.x),
    datasets: [{
      data: allPoints.map(p => p.y),
      borderColor: accent,
      backgroundColor: (context: ScriptableContext<'line'>): CanvasGradient | string => {
        const { ctx, chartArea } = context.chart
        if (!chartArea) return 'transparent'
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, hexToRgba(accent, 0.18))
        gradient.addColorStop(1, hexToRgba(accent, 0))
        return gradient
      },
      pointBackgroundColor: (context: ScriptableContext<'line'>): string =>
        context.dataIndex === allPoints.length - 1 ? TODAY_COLOR : accent,
      pointBorderColor: (context: ScriptableContext<'line'>): string =>
        context.dataIndex === allPoints.length - 1 ? TODAY_COLOR : accent,
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 3,
      fill: 'start',
    }],
  }
})

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#9ca3af', font: { size: 10 }, maxTicksLimit: 4, autoSkip: true },
    },
    y: {
      grid: { color: '#f5f5f5' },
      ticks: { color: '#9ca3af', font: { size: 10 }, precision: 0 },
    },
  },
}

// True when today already has a logged measurement — drives button "on" state
const todayLogged = computed(() =>
  fitnessStore.measurements.some(m => m.checkId === props.checkId && m.date === sessionsStore.today)
)

function confirm() {
  if (todayLogged.value) {
    fitnessStore.removeLogEntry(props.checkId, sessionsStore.today)
  } else {
    fitnessStore.logMeasurement(props.checkId, sessionsStore.today, pickerValue.value)
  }
}
</script>

<template>
  <div v-if="check" class="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
    <!-- Header: name + confirm button -->
    <div class="flex items-center justify-between">
      <p class="text-sm font-semibold text-gray-900">{{ check.name }}</p>
      <button
        class="w-8 h-8 flex items-center justify-center rounded-full border-2 transition-colors duration-150"
        :style="{
          borderColor: palette.accent,
          backgroundColor: todayLogged ? palette.accent : 'transparent',
          color: todayLogged ? '#ffffff' : palette.accent,
        }"
        @click="confirm"
      >
        <Check :size="15" />
      </button>
    </div>

    <!-- Chart + picker -->
    <div class="flex items-center gap-3">
      <!-- Chart (fills remaining width) -->
      <div class="flex-1 min-w-0">
        <div
          v-if="historicalPoints.length < 1 && !todayLogged"
          class="h-28 flex items-center justify-center text-sm text-gray-400"
        >
          No data yet
        </div>
        <div v-else class="h-28">
          <Line :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Divider -->
      <div class="w-px self-stretch bg-gray-100" />

      <!-- Picker (~3 rows to match h-28) -->
      <DrumRollPicker
        v-model="pickerValue"
        :min="min"
        :max="max"
        :step="step"
        :accent="palette.accent"
        :visible="3"
        :disabled="todayLogged"
      />
    </div>
  </div>
</template>
