<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MachineCard from '@/components/MachineCard.vue'
import { useMachinesStore } from '@/stores/machines'
import { useSessionsStore } from '@/stores/sessions'
import { useDailyPalette } from '@/composables/useDailyPalette'
import type { Machine } from '@/stores/machines'

const machinesStore = useMachinesStore()
const sessionsStore = useSessionsStore()
const palette = useDailyPalette()

const remainingMachines = ref<Machine[]>([])

function shuffle(ids: string[]): string[] {
  const a = [...ids]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]!
    a[i] = a[j]!
    a[j] = tmp
  }
  return a
}

onMounted(() => {
  const doneMachineIds = new Set(
    sessionsStore.todaySession?.machinesDone.map((e) => e.machineId) ?? [],
  )
  // Reuse today's order if it exists; otherwise shuffle once and persist
  let orderedIds = sessionsStore.todayMachineOrder
  if (!orderedIds) {
    orderedIds = shuffle(machinesStore.machines.map((m) => m.id))
    sessionsStore.saveTodayMachineOrder(orderedIds)
  }
  remainingMachines.value = orderedIds
    .map((id) => machinesStore.machines.find((m) => m.id === id))
    .filter((m): m is Machine => m !== undefined)
    .filter((m) => !doneMachineIds.has(m.id))
})

const visibleMachines = computed(() => remainingMachines.value.slice(0, 3))

function cardWrapperStyle(index: number) {
  if (index === 0) return { zIndex: 2 }
  if (index === 1)
    return {
      transform: 'translateY(36px) scale(0.93)',
      transformOrigin: 'top center',
      zIndex: 1,
      pointerEvents: 'none' as const,
    }
  return {
    transform: 'translateY(74px) scale(0.86)',
    transformOrigin: 'top center',
    zIndex: 0,
    pointerEvents: 'none' as const,
  }
}
</script>

<template>
  <div class="relative" style="width: min(80vw, 360px); height: min(80vw, 360px)">
    <div
      v-for="(machine, index) in visibleMachines"
      :key="machine.id"
      class="absolute left-0 right-0 top-0"
      :style="cardWrapperStyle(index)"
    >
      <MachineCard :machine="machine" :accent="palette.accent" />
    </div>
  </div>
</template>
