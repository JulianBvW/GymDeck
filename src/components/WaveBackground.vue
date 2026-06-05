<script setup lang="ts">
import { ref, computed, getCurrentInstance } from 'vue'
import { useElementSize } from '@vueuse/core'

const props = defineProps<{
  progress: number
  wave1: string
  wave2: string
  wave3: string
  flip?: boolean
}>()

const containerRef = ref<HTMLElement | null>(null)
const { width, height } = useElementSize(containerRef, { width: 390, height: 844 })

const uid = getCurrentInstance()?.uid ?? 0

const LAYERS = [
  { amp: 34, len: 460, dur: 22, yOffset: 0 },  // back, darkest (wave1)
  { amp: 20, len: 385, dur: 13, yOffset: 30 }, // middle (wave2)
  { amp: 12, len: 300, dur: 7,  yOffset: 60 }, // front, lightest (wave3)
] as const

const COLORS = computed(() => [props.wave1, props.wave2, props.wave3])

const MAX_HALF_PERIODS = 12

function buildWavePath(
  H: number,
  amp: number,
  len: number,
  baseY: number,
  yOffset: number,
  flip: boolean,
): string {
  const mid = baseY + yOffset
  const startX = -len
  const halfLen = len / 2
  const cp = halfLen * 0.5523  // cubic bezier magic number for sine approximation

  const edge = flip ? 0 : H
  let d = `M ${startX} ${edge} L ${startX} ${mid}`

  for (let i = 0; i < MAX_HALF_PERIODS; i++) {
    const x0 = startX + i * halfLen
    const x1 = x0 + halfLen
    const peakY = i % 2 === 0 ? mid - amp : mid + amp
    d += ` C ${x0 + cp} ${peakY} ${x1 - cp} ${peakY} ${x1} ${mid}`
  }

  d += ` L ${startX + MAX_HALF_PERIODS * halfLen} ${edge} Z`
  return d
}



const baseY = computed(() => {
  const H = height.value
  return props.flip
    ? props.progress * (H - 60) + 30
    : (1 - props.progress) * (H - 60) + 30 * props.progress
})

const paths = computed(() =>
  LAYERS.map((layer) =>
    buildWavePath(height.value, layer.amp, layer.len, baseY.value, layer.yOffset, props.flip ?? false),
  ),
)
</script>

<template>
  <div ref="containerRef" class="absolute inset-0 pointer-events-none overflow-hidden">
    <svg width="100%" height="100%" style="display: block; overflow: hidden">
      <defs>
        <linearGradient :id="`wg${uid}-0`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="COLORS[0]" stop-opacity="0.45" />
          <stop offset="100%" :stop-color="COLORS[0]" stop-opacity="0.15" />
        </linearGradient>
        <linearGradient :id="`wg${uid}-1`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="COLORS[1]" stop-opacity="0.45" />
          <stop offset="100%" :stop-color="COLORS[1]" stop-opacity="0.15" />
        </linearGradient>
        <linearGradient :id="`wg${uid}-2`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="COLORS[2]" stop-opacity="0.45" />
          <stop offset="100%" :stop-color="COLORS[2]" stop-opacity="0.15" />
        </linearGradient>
      </defs>

      <g class="wave-group-0">
        <path class="wave-path" :d="paths[0]" :fill="`url(#wg${uid}-0)`" />
      </g>
      <g class="wave-group-1">
        <path class="wave-path" :d="paths[1]" :fill="`url(#wg${uid}-1)`" />
      </g>
      <g class="wave-group-2">
        <path class="wave-path" :d="paths[2]" :fill="`url(#wg${uid}-2)`" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.wave-path {
  transition: d 600ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes waveScroll460 {
  from { transform: translateX(0px); }
  to   { transform: translateX(-460px); }
}
@keyframes waveScroll385 {
  from { transform: translateX(0px); }
  to   { transform: translateX(-385px); }
}
@keyframes waveScroll300 {
  from { transform: translateX(0px); }
  to   { transform: translateX(-300px); }
}

.wave-group-0 { animation: waveScroll460 22s linear infinite; }
.wave-group-1 { animation: waveScroll385 13s linear infinite; }
.wave-group-2 { animation: waveScroll300  7s linear infinite; }
</style>
