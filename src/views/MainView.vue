<script setup lang="ts">
import { ref, computed } from 'vue'
import CardStack from '@/components/CardStack.vue'
import WaveBackground from '@/components/WaveBackground.vue'
import { useMachinesStore } from '@/stores/machines'
import { useSessionsStore } from '@/stores/sessions'
import { useDailyPalette } from '@/composables/useDailyPalette'

const machinesStore = useMachinesStore()
const sessionsStore = useSessionsStore()
const palette = useDailyPalette()

const cardStackRef = ref()
const isSwiping = computed(() => cardStackRef.value?.isSwiping ?? false)

const progress = computed(() => {
  const total = machinesStore.machines.length
  if (total === 0) return 0
  return (sessionsStore.todaySession?.machinesDone.length ?? 0) / total
})
</script>

<template>
  <div class="relative h-full overflow-hidden">
    <WaveBackground
      :progress="progress"
      :wave1="palette.wave1"
      :wave2="palette.wave2"
      :wave3="palette.wave3"
    />
    <div class="relative z-10 h-full flex items-center justify-center">
      <CardStack ref="cardStackRef" />
    </div>
  </div>
</template>
