<script setup lang="ts">
import { ref, computed } from 'vue'
import WaveBackground from '@/components/WaveBackground.vue'
import LocationPulse from '@/components/LocationPulse.vue'
import { PALETTES } from '@/assets/palettes'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
const paletteIndex = ref(uiStore.dailyPaletteIndex)
const palette = computed(() => PALETTES[paletteIndex.value] ?? PALETTES[0]!)

function nextPalette() {
  paletteIndex.value = (paletteIndex.value + 1) % PALETTES.length
}
</script>

<template>
  <div class="min-h-screen bg-neutral-500 flex flex-col items-center justify-center gap-8">
    <!-- Icon square — screenshot this -->
    <div
      class="relative overflow-hidden bg-[#faf9f7] shadow-2xl flex-shrink-0"
      style="width: 512px; height: 512px;"
    >
      <!-- Waves: progress 0.33 → bottom third -->
      <WaveBackground
        :progress="0.33"
        :wave1="palette.wave1"
        :wave2="palette.wave2"
        :wave3="palette.wave3"
      />

      <!-- Card stack -->
      <div class="absolute inset-0" style="z-index: 10;">
        <!-- Back card -->
        <div
          class="absolute bg-white overflow-hidden"
          style="width: 280px; height: 280px; border-radius: 28px;
                 top: 116px; left: 116px; z-index: 1;
                 transform: translateY(56px) scale(0.86); transform-origin: top center;
                 box-shadow: 0 20px 60px rgba(0,0,0,0.15);"
        >
          <LocationPulse :x="0.7" :y="0.62" :accent="palette.accent" />
        </div>

        <!-- Middle card -->
        <div
          class="absolute bg-white overflow-hidden"
          style="width: 280px; height: 280px; border-radius: 28px;
                 top: 116px; left: 116px; z-index: 2;
                 transform: translateY(28px) scale(0.93); transform-origin: top center;
                 box-shadow: 0 20px 60px rgba(0,0,0,0.16);"
        >
          <LocationPulse :x="0.25" :y="0.68" :accent="palette.accent" />
        </div>

        <!-- Front card — half-swiped right -->
        <div
          class="absolute bg-white overflow-hidden"
          style="width: 280px; height: 280px; border-radius: 28px;
                 top: 116px; left: 116px; z-index: 3;
                 transform: translateX(80px) rotate(10deg);
                 box-shadow: 0 20px 60px rgba(0,0,0,0.18);"
        >
          <LocationPulse :x="0.33" :y="0.33" :accent="palette.accent" />
        </div>
      </div>
    </div>

    <!-- Palette cycler -->
    <button
      class="px-6 py-3 rounded-2xl text-sm font-semibold text-white touch-manipulation shadow"
      :style="{ backgroundColor: palette.wave2 }"
      @click="nextPalette"
    >
      {{ palette.name }} · {{ paletteIndex + 1 }} / {{ PALETTES.length }}
    </button>
  </div>
</template>
