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
  uiStore.transitionDirection = 'down'
  router.push('/')
}
</script>

<template>
  <div class="relative h-full overflow-hidden bg-[#faf9f7] flex flex-col">
    <WaveBackground
      :progress="0.1"
      :flip="true"
      :wave1="palette.wave1"
      :wave2="palette.wave2"
      :wave3="palette.wave3"
    />

    <div class="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-4">
      <span class="font-semibold text-gray-900">Statistics</span>
      <button
        class="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-800 rounded-full"
        aria-label="Back"
        @click="goBack"
      >
        <ChevronDown :size="22" />
      </button>
    </div>

    <div class="relative z-10 flex-1 overflow-y-auto pt-16 pb-8 px-5 flex flex-col gap-6">
      <!-- Parts 2, 3, 4 go here -->
    </div>
  </div>
</template>
