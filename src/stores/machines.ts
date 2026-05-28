import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

export interface Machine {
  id: string
  name: string
  locationX: number
  locationY: number
  currentWeight: number
  stepSize: number
}

const SEED_MACHINES: Machine[] = [
  { id: crypto.randomUUID(), name: 'Chest Press',     locationX: 0.3, locationY: 0.4, currentWeight: 40, stepSize: 2.5 },
  { id: crypto.randomUUID(), name: 'Lat Pulldown',    locationX: 0.7, locationY: 0.3, currentWeight: 35, stepSize: 2.5 },
  { id: crypto.randomUUID(), name: 'Leg Press',       locationX: 0.5, locationY: 0.8, currentWeight: 80, stepSize: 5   },
  { id: crypto.randomUUID(), name: 'Shoulder Press',  locationX: 0.2, locationY: 0.6, currentWeight: 25, stepSize: 2.5 },
]

export const useMachinesStore = defineStore('machines', () => {
  const machines = useLocalStorage<Machine[]>('gymdeck-machines', [])

  if (machines.value.length === 0) {
    machines.value = SEED_MACHINES
  }

  function addMachine(data: Omit<Machine, 'id'>) {
    machines.value.push({ id: crypto.randomUUID(), ...data })
  }

  function updateMachine(id: string, data: Partial<Omit<Machine, 'id'>>) {
    const machine = machines.value.find(m => m.id === id)
    if (machine) Object.assign(machine, data)
  }

  function deleteMachine(id: string) {
    machines.value = machines.value.filter(m => m.id !== id)
  }

  return { machines, addMachine, updateMachine, deleteMachine }
})
