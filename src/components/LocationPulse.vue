<script setup lang="ts">
const props = defineProps<{
  x: number
  y: number
  accent: string
}>()

const gradientId = `glow-${props.x}-${props.y}-${props.accent.replace('#', '')}`
const RING_RADII = [40, 78, 120, 168, 220, 280]

function ringOpacity(i: number): number {
  return Math.max(0.04, 0.22 - i * 0.032)
}
</script>

<template>
  <div style="position: absolute; inset: 0; overflow: hidden; pointer-events: none;">
    <svg width="100%" height="100%" style="position: absolute; inset: 0;">
      <defs>
        <radialGradient
          :id="gradientId"
          :cx="`${x * 100}%`"
          :cy="`${y * 100}%`"
          r="70%"
        >
          <stop offset="0%"   :stop-color="accent" stop-opacity="0.32" />
          <stop offset="35%"  :stop-color="accent" stop-opacity="0.12" />
          <stop offset="100%" :stop-color="accent" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- radial glow -->
      <rect width="100%" height="100%" :fill="`url(#${gradientId})`" />

      <!-- concentric rings -->
      <circle
        v-for="(r, i) in RING_RADII"
        :key="r"
        :cx="`${x * 100}%`"
        :cy="`${y * 100}%`"
        :r="r"
        fill="none"
        :stroke="accent"
        :stroke-opacity="ringOpacity(i)"
        stroke-width="1"
      />

      <!-- origin dot -->
      <circle
        :cx="`${x * 100}%`"
        :cy="`${y * 100}%`"
        r="4"
        :fill="accent"
        opacity="0.85"
      />
    </svg>
  </div>
</template>
