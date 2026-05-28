<script setup lang="ts">
import { computed } from 'vue'
import MachineCard from '@/components/MachineCard.vue'
import { useMachinesStore } from '@/stores/machines'
import { useDailyPalette } from '@/composables/useDailyPalette'

const machinesStore = useMachinesStore()
const palette = useDailyPalette()

const firstMachine = computed(() => machinesStore.machines[0])
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <MachineCard
      v-if="firstMachine"
      :machine="firstMachine"
      :accent="palette.accent"
    />
  </div>
</template>
