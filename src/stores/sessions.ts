import { computed } from 'vue'
import { useLocalStorage, StorageSerializers } from '@vueuse/core'
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
  // Today's deck: the shuffled order plus the machines skipped out of it.
  // `skipped` is optional on read — decks persisted before it existed lack the field.
  // The explicit serializer is required: useLocalStorage guesses the serializer from
  // the default value, and a `null` default guesses "any", whose writer is String(v).
  const deckStorage = useLocalStorage<{ date: string; order: string[]; skipped?: string[] } | null>(
    'gymdeck-machine-order',
    null,
    { serializer: StorageSerializers.object },
  )

  const todayDeck = computed(() => {
    const stored = deckStorage.value
    return stored?.date === toDateString(new Date()) ? stored : null
  })

  const todayMachineOrder = computed<string[] | null>(() => todayDeck.value?.order ?? null)
  const todaySkipped = computed<string[]>(() => todayDeck.value?.skipped ?? [])

  // Rewrites the order while preserving today's skips. On a new day `todaySkipped`
  // is already empty, so the fresh deck starts unskipped.
  function saveTodayMachineOrder(order: string[]) {
    deckStorage.value = { date: toDateString(new Date()), order, skipped: todaySkipped.value }
  }

  function skipMachineToday(machineId: string) {
    const deck = todayDeck.value
    if (!deck || todaySkipped.value.includes(machineId)) return
    deckStorage.value = {
      date: deck.date,
      order: deck.order,
      skipped: [...todaySkipped.value, machineId],
    }
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

    const weekCursor = new Date(thisWeek + 'T00:00:00')
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

  function clearMachineOrder() {
    deckStorage.value = null
  }

  return { sessions, today, todaySession, totalSessions, currentStreak, todayMachineOrder, todaySkipped, saveTodayMachineOrder, skipMachineToday, clearMachineOrder, startSessionIfNeeded, logEntry }
})
