<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions, ScriptableContext } from 'chart.js'
import { useSessionsStore } from '@/stores/sessions'
import { formatDayMonth } from '@/utils/date'

const props = defineProps<{
  machineId: string
  machineName: string
}>()

const sessionsStore = useSessionsStore()

const LINE_COLOR = '#1a1a1a'

const points = computed(() =>
  sessionsStore.sessions
    .filter(s => s.machinesDone.some(e => e.machineId === props.machineId))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => {
      const entry = s.machinesDone.find(e => e.machineId === props.machineId)!
      return { x: formatDayMonth(s.date), y: entry.weight }
    })
)

const chartData = computed<ChartData<'line'>>(() => ({
  labels: points.value.map(p => p.x),
  datasets: [{
    data: points.value.map(p => p.y),
    borderColor: LINE_COLOR,
    backgroundColor: (context: ScriptableContext<'line'>): CanvasGradient | string => {
      const { ctx, chartArea } = context.chart
      if (!chartArea) return 'transparent'
      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
      gradient.addColorStop(0, 'rgba(26, 26, 26, 0.18)')
      gradient.addColorStop(1, 'rgba(26, 26, 26, 0)')
      return gradient
    },
    pointBackgroundColor: LINE_COLOR,
    borderWidth: 2,
    tension: 0.4,
    pointRadius: 3,
    fill: 'start',
  }],
}))

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: '#9ca3af',
        font: { size: 11 },
        maxTicksLimit: 4,
        autoSkip: true,
      },
    },
    y: {
      grid: { color: '#f5f5f5' },
      ticks: { color: '#9ca3af', font: { size: 11 }, precision: 0 },
    },
  },
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm p-4">
    <p class="text-sm font-semibold text-gray-900 mb-3">{{ machineName }}</p>
    <div
      v-if="points.length === 0"
      class="h-16 flex items-center justify-center text-sm text-gray-400"
    >
      Not enough data yet
    </div>
    <div v-else class="h-32">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
