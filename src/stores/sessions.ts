import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { toDateString, startOfWeek } from '@/utils/date'

export interface MachineEntry {
  machineId: string
  weight: number
  weightIncreased: boolean
}

export interface Session {
  id: string
  date: string  // "YYYY-MM-DD"
  machinesDone: MachineEntry[]
}


export const useSessionsStore = defineStore('sessions', () => {
  const sessions = useLocalStorage<Session[]>('gymdeck-sessions', [])
  const machineOrderStorage = useLocalStorage<{ date: string; order: string[] } | null>('gymdeck-machine-order', null)

  const todayMachineOrder = computed<string[] | null>(() => {
    const stored = machineOrderStorage.value
    return stored?.date === toDateString(new Date()) ? stored.order : null
  })

  function saveTodayMachineOrder(order: string[]) {
    machineOrderStorage.value = { date: toDateString(new Date()), order }
  }

  const today = computed(() => toDateString(new Date()))

  const todaySession = computed(() =>
    sessions.value.find(s => s.date === today.value) ?? null
  )

  const totalSessions = computed(() =>
    sessions.value.filter(s => s.machinesDone.length >= 1).length
  )

  // Streak = consecutive weeks (ending this week) with at least one valid session
  const currentStreak = computed(() => {
    const validDates = new Set(
      sessions.value
        .filter(s => s.machinesDone.length >= 1)
        .map(s => startOfWeek(s.date))
    )

    let streak = 0
    const now = new Date()
    const thisWeek = startOfWeek(toDateString(now))

    let weekCursor = new Date(thisWeek + 'T00:00:00')
    while (true) {
      const weekStr = toDateString(weekCursor)
      if (!validDates.has(weekStr)) break
      streak++
      weekCursor.setDate(weekCursor.getDate() - 7)
    }
    return streak
  })

  function startSessionIfNeeded() {
    if (todaySession.value) return
    sessions.value.push({ id: crypto.randomUUID(), date: today.value, machinesDone: [] })
  }

  function logEntry(entry: MachineEntry) {
    startSessionIfNeeded()
    const session = sessions.value.find(s => s.date === today.value)
    if (!session) return
    const existing = session.machinesDone.find(e => e.machineId === entry.machineId)
    if (existing) {
      Object.assign(existing, entry)
    } else {
      session.machinesDone.push(entry)
    }
  }

  return { sessions, today, todaySession, totalSessions, currentStreak, todayMachineOrder, saveTodayMachineOrder, startSessionIfNeeded, logEntry }
})
