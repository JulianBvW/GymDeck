<script setup lang="ts">
import { computed } from 'vue'
import MachineCard from '@/components/MachineCard.vue'
import { useMachinesStore } from '@/stores/machines'
import { useSessionsStore } from '@/stores/sessions'
import { useDailyPalette } from '@/composables/useDailyPalette'

const machinesStore = useMachinesStore()
const sessionsStore = useSessionsStore()
const palette = useDailyPalette()

const firstMachine = computed(() => machinesStore.machines[0])

function onDone() {
  if (!firstMachine.value) return
  sessionsStore.logEntry({
    machineId: firstMachine.value.id,
    weight: firstMachine.value.currentWeight,
    weightIncreased: false,
  })
  console.log('done', firstMachine.value.name, firstMachine.value.currentWeight + 'kg')
}

function onWeightUp() {
  if (!firstMachine.value) return
  // Snapshot current weight before incrementing
  const weight = firstMachine.value.currentWeight
  sessionsStore.logEntry({
    machineId: firstMachine.value.id,
    weight,
    weightIncreased: true,
  })
  machinesStore.updateMachine(firstMachine.value.id, {
    currentWeight: weight + firstMachine.value.stepSize,
  })
  console.log('weightUp', firstMachine.value.name, weight + 'kg → ' + firstMachine.value.currentWeight + 'kg')
}

function onLater() {
  console.log('later', firstMachine.value?.name)
}

function onSkip() {
  console.log('skip', firstMachine.value?.name)
}
</script>

<template>
  <div class="h-full flex items-center justify-center">
    <MachineCard
      v-if="firstMachine"
      :machine="firstMachine"
      :accent="palette.accent"
      @done="onDone"
      @weight-up="onWeightUp"
      @later="onLater"
      @skip="onSkip"
    />
  </div>
</template>
