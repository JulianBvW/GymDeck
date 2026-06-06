import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

export interface FitnessCheck {
  id: string
  name: string
  unit: string
  stepSize: number
}

export interface FitnessMeasurement {
  id: string
  checkId: string
  date: string  // "YYYY-MM-DD"
  value: number
}

const SEED_CHECKS: FitnessCheck[] = [
  { id: crypto.randomUUID(), name: 'Push Ups',         unit: 'reps', stepSize: 1   },
  { id: crypto.randomUUID(), name: 'Stretching Reach', unit: 'cm',   stepSize: 0.5 },
]

export const useFitnessStore = defineStore('fitness', () => {
  const checks = useLocalStorage<FitnessCheck[]>('gymdeck-fitness-checks', [])
  const measurements = useLocalStorage<FitnessMeasurement[]>('gymdeck-fitness-measurements', [])

  if (checks.value.length === 0) {
    checks.value = SEED_CHECKS
  }

  function addCheck(data: Omit<FitnessCheck, 'id'>) {
    checks.value.push({ id: crypto.randomUUID(), ...data })
  }

  function updateCheck(id: string, data: Partial<Omit<FitnessCheck, 'id'>>) {
    const check = checks.value.find(c => c.id === id)
    if (check) Object.assign(check, data)
  }

  function deleteCheck(id: string) {
    checks.value = checks.value.filter(c => c.id !== id)
    measurements.value = measurements.value.filter(m => m.checkId !== id)
  }

  function logMeasurement(checkId: string, date: string, value: number) {
    const existing = measurements.value.find(m => m.checkId === checkId && m.date === date)
    if (existing) {
      existing.value = value
    } else {
      measurements.value.push({ id: crypto.randomUUID(), checkId, date, value })
    }
  }

  function removeLogEntry(checkId: string, date: string) {
    measurements.value = measurements.value.filter(
      m => !(m.checkId === checkId && m.date === date)
    )
  }

  return { checks, measurements, addCheck, updateCheck, deleteCheck, logMeasurement, removeLogEntry }
})
