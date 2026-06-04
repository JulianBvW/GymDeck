<script setup lang="ts">
import { computed } from 'vue'
import { useSessionsStore } from '@/stores/sessions'

const sessionsStore = useSessionsStore()

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  return toDateString(d)
}

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
  return [
    { label: 'Q1', weeks: ws.slice(0, 13) },
    { label: 'Q2', weeks: ws.slice(13, 26) },
    { label: 'Q3', weeks: ws.slice(26, 39) },
    { label: 'Q4', weeks: ws.slice(39, 52) },
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
            :key="w"
            class="aspect-square rounded-sm"
            :class="{ 'border border-dashed border-gray-300': weekState(w) === 'future' }"
            :style="{
              backgroundColor:
                weekState(w) === 'done'   ? '#1a1a1a' :
                weekState(w) === 'future' ? '#f5f5f5' :
                '#e0e0e0',
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
