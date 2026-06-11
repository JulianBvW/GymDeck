<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ChevronDown, Plus } from 'lucide-vue-next'
import WaveBackground from '@/components/WaveBackground.vue'
import FitnessCard from '@/components/FitnessCard.vue'
import { useUIStore } from '@/stores/ui'
import { useFitnessStore } from '@/stores/fitness'
import { useDailyPalette } from '@/composables/useDailyPalette'

const router = useRouter()
const uiStore = useUIStore()
const fitnessStore = useFitnessStore()
const palette = useDailyPalette()

function goBack() {
  uiStore.transitionDirection = 'up'
  router.push('/')
}

function goToSettings() {
  uiStore.transitionDirection = 'right'
  router.push('/settings')
}
</script>

<template>
  <div class="relative h-full overflow-hidden bg-[#faf9f7] flex flex-col">
    <WaveBackground
      :progress="0.15"
      :flip="true"
      :wave1="palette.wave1"
      :wave2="palette.wave2"
      :wave3="palette.wave3"
    />

    <div
      class="relative z-10 flex-1 overflow-y-auto px-5 flex flex-col gap-6"
      style="padding-top: calc(1rem + env(safe-area-inset-top)); padding-bottom: calc(2rem + env(safe-area-inset-bottom)); overscroll-behavior-y: contain"
    >
      <!-- Header -->
      <div class="flex flex-col gap-0 cursor-pointer touch-manipulation" @click="goBack">
        <div class="flex items-center justify-between">
          <span class="font-semibold tracking-widest text-[10px] text-gray-600 uppercase">Fitness</span>
          <div class="w-11 h-11 flex items-center justify-center text-gray-500 rounded-full">
            <ChevronDown :size="22" />
          </div>
        </div>
        <h1 class="-mt-2 text-2xl font-bold text-gray-900">Daily checks</h1>
      </div>

      <!-- Fitness cards / empty state -->
      <div v-if="fitnessStore.checks.length === 0" class="flex flex-col items-center justify-center gap-3 text-center py-12">
        <div class="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center">
          <Plus :size="28" :style="{ color: palette.wave1 }" />
        </div>
        <p class="font-bold text-gray-900 text-xl">No checks yet</p>
        <p class="text-gray-500 text-sm">Add fitness checks in Settings</p>
        <button
          class="mt-1 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white touch-manipulation"
          :style="{ backgroundColor: palette.wave1 }"
          @click="goToSettings"
        >
          Add in Settings →
        </button>
      </div>
      <div v-else class="flex flex-col gap-4">
        <FitnessCard v-for="check in fitnessStore.checks" :key="check.id" :check-id="check.id" />
      </div>
    </div>
  </div>
</template>
