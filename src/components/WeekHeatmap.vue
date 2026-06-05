<script setup lang="ts">
import { computed } from 'vue'
import { useSessionsStore } from '@/stores/sessions'
import { toDateString, startOfWeek } from '@/utils/date'

const sessionsStore = useSessionsStore()

// 52 weeks starting from the Monday of CW1 (week containing Jan 1)
function weeksOfYear(year: number): string[] {
  const jan1 = new Date(year, 0, 1)
  const day = jan1.getDay()
  const diff = day === 0 ? 6 : day - 1
  const cursor = new Date(year, 0, 1 - diff)
  const weeks: string[] = []
  for (let i = 0; i < 52; i++) {
    weeks.push(toDateString(cursor))
    cursor.setDate(cursor.getDate() + 7)
  }
  return weeks
}

const weeks = computed(() => weeksOfYear(new Date().getFullYear()))

const sessionWeeks = computed(() => {
  const set = new Set<string>()
  sessionsStore.sessions
    .filter(s => s.machinesDone.length >= 1)
    .forEach(s => set.add(startOfWeek(s.date)))
  return set
})

const thisWeek = computed(() => startOfWeek(toDateString(new Date())))

type WeekState = 'done' | 'missed' | 'future'

function weekState(weekStart: string): WeekState {
  if (weekStart > thisWeek.value) return 'future'
  return sessionWeeks.value.has(weekStart) ? 'done' : 'missed'
}

const quarters = computed(() => {
  const ws = weeks.value
  const toWeekData = (weekStart: string) => ({ weekStart, state: weekState(weekStart) })
  return [
    { label: 'Q1', weeks: ws.slice(0, 13).map(toWeekData) },
    { label: 'Q2', weeks: ws.slice(13, 26).map(toWeekData) },
    { label: 'Q3', weeks: ws.slice(26, 39).map(toWeekData) },
    { label: 'Q4', weeks: ws.slice(39, 52).map(toWeekData) },
  ]
})
</script>

<template>
  <div>
    <p class="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2 px-1">
      Sessions this year
    </p>
    <div class="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
      <div v-for="q in quarters" :key="q.label" class="flex items-center gap-2">
        <span class="text-xs font-semibold text-gray-400 w-5 shrink-0">{{ q.label }}</span>
        <div class="grid gap-1 flex-1" style="grid-template-columns: repeat(13, 1fr)">
          <div
            v-for="w in q.weeks"
            :key="w.weekStart"
            class="aspect-square rounded-sm"
            :class="{ 'border border-dashed border-gray-300': w.state === 'future' }"
            :style="{
              backgroundColor:
                w.state === 'done'   ? '#1a1a1a' :
                w.state === 'future' ? '#f5f5f5' :
                '#e0e0e0',
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
