import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

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

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfWeek(dateStr: string): string {
  // Parse as local midnight to avoid UTC offset shifting the date
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay() // 0=Sun, 1=Mon … 6=Sat
  const diff = day === 0 ? 6 : day - 1 // days back to Monday
  d.setDate(d.getDate() - diff)
  return toDateString(d)
}

export const useSessionsStore = defineStore('sessions', () => {
  const sessions = useLocalStorage<Session[]>('gymdeck-sessions', [])

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

    let weekCursor = new Date(thisWeek)
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
    const session = sessions.value.find(s => s.date === today.value)!
    const existing = session.machinesDone.findIndex(e => e.machineId === entry.machineId)
    if (existing !== -1) {
      session.machinesDone[existing] = entry
    } else {
      session.machinesDone.push(entry)
    }
  }

  return { sessions, today, todaySession, totalSessions, currentStreak, startSessionIfNeeded, logEntry }
})
