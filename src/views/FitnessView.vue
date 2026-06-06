<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ChevronDown, Settings } from 'lucide-vue-next'
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
      class="relative z-10 flex-1 overflow-y-auto pt-4 pb-8 px-5 flex flex-col gap-6"
      style="overscroll-behavior-y: contain"
    >
      <!-- Header -->
      <div class="flex flex-col gap-0 cursor-pointer touch-manipulation" @click="goBack">
        <div class="flex items-center justify-between">
          <span class="font-semibold tracking-widest text-[10px] text-gray-600 uppercase">Fitness</span>
          <div class="flex items-center gap-1">
            <button
              class="w-9 h-9 flex items-center justify-center text-gray-500 rounded-full touch-manipulation"
              @click.stop="goToSettings"
            >
              <Settings :size="18" />
            </button>
            <div class="w-9 h-9 flex items-center justify-center text-gray-500 rounded-full">
              <ChevronDown :size="22" />
            </div>
          </div>
        </div>
        <h1 class="-mt-2 text-2xl font-bold text-gray-900">Daily checks</h1>
      </div>

      <!-- Fitness cards -->
      <div class="flex flex-col gap-4">
        <FitnessCard v-for="check in fitnessStore.checks" :key="check.id" :check-id="check.id" />
      </div>
    </div>
  </div>
</template>
