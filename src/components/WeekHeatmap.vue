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

const thisWeek = computed(() => startOfWeek(toDateString(new Date())))

type WeekState = 'none' | 'one' | 'two' | 'future'

// Threshold is >= 2, not === 2, so a three-session week does not fall back to
// looking like a single one.
function weekState(weekStart: string): WeekState {
  if (weekStart > thisWeek.value) return 'future'
  const count = sessionsStore.sessionsPerWeek.get(weekStart) ?? 0
  return count >= 2 ? 'two' : count === 1 ? 'one' : 'none'
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
            :class="'week-' + w.state"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* One session fills the cell half, two or more fill it completely — the cell
   doubles as a progress meter for the week. All four fills are constants, so
   they belong in CSS rather than an inline :style binding. */
.week-none   { background: #e0e0e0; }
.week-one    { background: linear-gradient(to top, #1a1a1a 50%, #e0e0e0 50%); }
.week-two    { background: #1a1a1a; }
.week-future { background: #f5f5f5; border: 1px dashed #d1d5db; }
</style>
