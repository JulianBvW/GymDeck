<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  modelValue: number
  min: number
  max: number
  step: number
  accent: string
  visible?: number  // number of visible rows; must be odd. Default 5.
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const ITEM_H = 36
const visibleCount = computed(() => props.visible ?? 5)
// Padding rows above/below so the first/last value can snap to centre
const pad = computed(() => Math.floor(visibleCount.value / 2))

const containerRef = ref<HTMLElement | null>(null)

const values = computed(() => {
  const count = Math.round((props.max - props.min) / props.step)
  return Array.from(
    { length: count + 1 },
    (_, i) =>
      // Round each step to avoid floating-point drift (0.1 + 0.1 + 0.1 ≠ 0.3)
      Math.round((props.min + i * props.step) * 1e10) / 1e10,
  )
})

const decimals = computed(() => (props.step % 1 === 0 ? 0 : 1))

function formatValue(v: number): string {
  return v.toFixed(decimals.value)
}

const selectedIndex = computed(() =>
  values.value.findIndex((v) => Math.abs(v - props.modelValue) < props.step * 0.5),
)

function scrollTopForIndex(idx: number): number {
  return idx * ITEM_H
}

// Guard to prevent watch-triggered scroll from re-emitting intermediate positions
let suppressScrollEmit = false

function onScroll() {
  if (suppressScrollEmit || props.disabled) return
  const el = containerRef.value
  if (!el) return
  const idx = Math.round(el.scrollTop / ITEM_H)
  const clamped = Math.max(0, Math.min(idx, values.value.length - 1))
  const newVal = values.value[clamped]
  if (newVal !== undefined && newVal !== props.modelValue) {
    emit('update:modelValue', newVal)
  }
}

watch(
  () => props.modelValue,
  (val) => {
    const idx = values.value.findIndex((v) => Math.abs(v - val) < props.step * 0.5)
    if (idx === -1) return
    const el = containerRef.value
    if (!el) return
    suppressScrollEmit = true
    el.scrollTo({ top: scrollTopForIndex(idx), behavior: 'smooth' })
    setTimeout(() => {
      suppressScrollEmit = false
    }, 400)
  },
)

function onTouchStart(e: TouchEvent) {
  e.stopPropagation()
}

function onTouchMove(e: TouchEvent) {
  e.stopPropagation()
  // Block touch-scroll entirely when locked
  if (props.disabled) e.preventDefault()
}

onMounted(() => {
  const el = containerRef.value
  if (!el) return
  // Instant initial positioning — direct assignment avoids ScrollBehavior type issues
  el.scrollTop = scrollTopForIndex(Math.max(0, selectedIndex.value))
  el.addEventListener('scroll', onScroll, { passive: true })
  el.addEventListener('touchstart', onTouchStart, { passive: false })
  el.addEventListener('touchmove', onTouchMove, { passive: false })
})

onUnmounted(() => {
  const el = containerRef.value
  if (!el) return
  el.removeEventListener('scroll', onScroll)
  el.removeEventListener('touchstart', onTouchStart)
  el.removeEventListener('touchmove', onTouchMove)
})
</script>

<template>
  <div class="relative select-none w-10" :style="{ height: `${ITEM_H * visibleCount}px` }">
    <!-- Centre highlight band — no z-index so scroll content renders on top -->
    <div
      class="absolute inset-x-0 rounded-lg bg-gray-100 pointer-events-none"
      :style="{ top: `${ITEM_H * pad}px`, height: `${ITEM_H}px` }"
    />

    <div
      ref="containerRef"
      class="drum-scroll relative z-10 h-full"
      :class="disabled ? 'overflow-y-hidden' : 'overflow-y-scroll'"
      style="scroll-snap-type: y mandatory; overscroll-behavior: contain"
    >
      <!-- Top sentinel so the first value can snap to centre -->
      <div :style="{ height: `${ITEM_H * pad}px` }" />

      <div
        v-for="(v, i) in values"
        :key="v"
        class="flex items-center justify-center transition-colors duration-100"
        :style="{
          height: `${ITEM_H}px`,
          scrollSnapAlign: 'center',
          color: i === selectedIndex ? accent : '#9ca3af',
          fontWeight: i === selectedIndex ? '700' : '400',
          fontSize: i === selectedIndex ? '15px' : '13px',
        }"
      >
        {{ formatValue(v) }}
      </div>

      <!-- Bottom sentinel so the last value can snap to centre -->
      <div :style="{ height: `${ITEM_H * pad}px` }" />
    </div>
  </div>
</template>

<style scoped>
.drum-scroll {
  scrollbar-width: none;
}
.drum-scroll::-webkit-scrollbar {
  display: none;
}
</style>
