<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Activity, Settings } from 'lucide-vue-next'
import CardStack from '@/components/CardStack.vue'
import WaveBackground from '@/components/WaveBackground.vue'
import { useMachinesStore } from '@/stores/machines'
import { useSessionsStore } from '@/stores/sessions'
import { useUIStore } from '@/stores/ui'
import { useDailyPalette } from '@/composables/useDailyPalette'

const machinesStore = useMachinesStore()
const sessionsStore = useSessionsStore()
const uiStore = useUIStore()
const palette = useDailyPalette()
const router = useRouter()

const cardStackRef = ref()
const isSwiping = computed<boolean>(() => cardStackRef.value?.isSwiping?.value ?? false)

const doneCount = computed(() => sessionsStore.todaySession?.machinesDone.length ?? 0)
const totalCount = computed(() => machinesStore.machines.length)

const progress = computed(() => {
  if (totalCount.value === 0) return 0
  return doneCount.value / totalCount.value
})

function goToFitness() {
  uiStore.transitionDirection = 'down'
  router.push('/fitness')
}

function goToSettings() {
  uiStore.transitionDirection = 'right'
  router.push('/settings')
}

function onBottomZoneTap() {
  if (isSwiping.value) return
  uiStore.transitionDirection = 'up'
  router.push('/stats')
}
</script>

<template>
  <div class="relative h-full overflow-hidden">
    <WaveBackground
      :progress="progress"
      :wave1="palette.wave1"
      :wave2="palette.wave2"
      :wave3="palette.wave3"
    />

    <!-- Top bar -->
    <div
      class="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pb-4"
      style="padding-top: calc(1rem + env(safe-area-inset-top))"
    >
      <span class="text-sm font-medium text-gray-500">{{ doneCount }} / {{ totalCount }}</span>
      <div class="flex items-center gap-1">
        <button
          class="w-11 h-11 flex items-center justify-center text-gray-500 hover:text-gray-800 rounded-full touch-manipulation"
          aria-label="Fitness"
          @click="goToFitness"
        >
          <Activity :size="20" />
        </button>
        <button
          class="w-11 h-11 flex items-center justify-center text-gray-500 hover:text-gray-800 rounded-full touch-manipulation"
          aria-label="Settings"
          @click="goToSettings"
        >
          <Settings :size="20" />
        </button>
      </div>
    </div>

    <!-- Card stack -->
    <div class="relative z-10 h-full flex items-center justify-center">
      <CardStack ref="cardStackRef" />
    </div>

    <!-- Bottom touch zone → Stats -->
    <div class="absolute bottom-0 left-0 right-0 z-10 h-[25%]" @touchend="onBottomZoneTap" />
  </div>
</template>
