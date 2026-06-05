<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ChevronDown } from 'lucide-vue-next'
import WaveBackground from '@/components/WaveBackground.vue'
import { useUIStore } from '@/stores/ui'
import { useDailyPalette } from '@/composables/useDailyPalette'

const router = useRouter()
const uiStore = useUIStore()
const palette = useDailyPalette()

function goBack() {
  uiStore.transitionDirection = 'up'
  router.push('/')
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

    <div class="relative z-10 flex-1 overflow-y-auto pt-4 pb-8 px-5 flex flex-col gap-6"
         style="overscroll-behavior-y: contain">
      <!-- Header -->
      <div class="flex flex-col gap-0">
        <div class="flex items-center justify-between">
          <span class="font-semibold tracking-widest text-[10px] text-gray-600 uppercase">Fitness</span>
          <button
            class="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-800 rounded-full"
            aria-label="Back"
            @click="goBack"
          >
            <ChevronDown :size="22" />
          </button>
        </div>
        <h2 class="text-2xl font-bold text-gray-900">Your body</h2>
      </div>

      <!-- Fitness cards -->
      <div class="flex flex-col gap-4">
        <!-- FitnessCard components go here in Part 3 -->
      </div>
    </div>
  </div>
</template>
