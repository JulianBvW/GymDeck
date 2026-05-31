<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { X, Clock, ArrowUp, Check } from 'lucide-vue-next'
import LocationPulse from '@/components/LocationPulse.vue'
import type { Machine } from '@/stores/machines'

defineProps<{
  machine: Machine
  accent: string
}>()

const emit = defineEmits<{
  done: []
  later: []
  weightUp: []
  skip: []
  'swipe-start': []
  'swipe-end': []
}>()

// --- swipe gesture state ---
const cardEl = ref<HTMLElement | null>(null)
let startX = 0
let startY = 0
let dragY = 0 // non-reactive; only used to guard horizontal preventDefault
const isDragging = ref(false)
const isSnapping = ref(false)
const dragX = ref(0)
const swipeDirection = ref<'left' | 'right' | 'up' | null>(null)

const cardStyle = computed(() => {
  if (swipeDirection.value) return {} // CSS class handles swipe-out transform
  if (!isDragging.value && !isSnapping.value) return {}
  const rotate = Math.max(-15, Math.min(15, dragX.value * 0.08))
  return {
    transform: `translateX(${dragX.value}px) rotate(${rotate}deg)`,
    transition: isSnapping.value ? 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
  }
})

function onTouchStart(e: TouchEvent) {
  if (swipeDirection.value) return
  const t = e.touches[0]
  if (!t) return
  startX = t.clientX
  startY = t.clientY
  dragX.value = 0
  dragY = 0
  isDragging.value = true
  isSnapping.value = false
  emit('swipe-start')
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging.value) return
  const t = e.touches[0]
  if (!t) return
  dragX.value = t.clientX - startX
  dragY = t.clientY - startY
  // Only block native scroll when horizontal movement dominates
  if (Math.abs(dragX.value) > Math.abs(dragY)) {
    e.preventDefault()
  }
}

function triggerSwipeOut(direction: 'left' | 'right' | 'up') {
  isDragging.value = false
  isSnapping.value = false
  swipeDirection.value = direction
  setTimeout(() => {
    swipeDirection.value = null
    dragX.value = 0
    if (direction === 'right') emit('done')
    else if (direction === 'left') emit('later')
    else emit('weightUp')
    emit('swipe-end')
  }, 300)
}

function snapBack() {
  isDragging.value = false
  isSnapping.value = true
  dragX.value = 0
  setTimeout(() => {
    isSnapping.value = false
    emit('swipe-end')
  }, 380) // 80ms buffer past the 300ms spring transition
}

function onTouchEnd() {
  if (!isDragging.value) return
  const absX = Math.abs(dragX.value)
  if (absX > 80) {
    triggerSwipeOut(dragX.value > 0 ? 'right' : 'left')
  } else if (absX > 5) {
    snapBack()
  } else {
    isDragging.value = false
    emit('swipe-end')
  }
}

onMounted(() => {
  cardEl.value?.addEventListener('touchstart', onTouchStart, { passive: true })
  cardEl.value?.addEventListener('touchmove', onTouchMove, { passive: false })
  cardEl.value?.addEventListener('touchend', onTouchEnd, { passive: true })
})

onUnmounted(() => {
  cardEl.value?.removeEventListener('touchstart', onTouchStart)
  cardEl.value?.removeEventListener('touchmove', onTouchMove)
  cardEl.value?.removeEventListener('touchend', onTouchEnd)
})
</script>

<template>
  <div
    ref="cardEl"
    class="relative bg-white overflow-hidden shadow-xl"
    :class="{
      'swipe-left': swipeDirection === 'left',
      'swipe-right': swipeDirection === 'right',
      'swipe-up': swipeDirection === 'up',
    }"
    :style="[
      {
        width: 'min(80vw, 360px)',
        height: 'min(80vw, 360px)',
        borderRadius: '28px',
        flexShrink: 0,
      },
      cardStyle,
    ]"
  >
    <!-- background rings layer -->
    <LocationPulse :x="machine.locationX" :y="machine.locationY" :accent="accent" />

    <!-- card content -->
    <div class="relative z-10 flex flex-col h-full p-5">
      <!-- top row: name + skip -->
      <div class="flex items-center justify-between">
        <span
          class="font-bold text-xl text-gray-900 leading-tight max-w-[75%]"
          style="margin-top: -4px"
        >
          {{ machine.name }}
        </span>
        <button
          class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full"
          aria-label="Skip for today"
          @click="emit('skip')"
        >
          <X :size="18" />
        </button>
      </div>

      <!-- middle: weight display -->
      <div class="flex-1 flex items-end justify-start gap-1.5 pb-4">
        <span class="font-bold text-gray-900 leading-none" style="font-size: 76px">
          {{ machine.currentWeight }}
        </span>
        <span class="text-gray-400 font-bold" style="font-size: 22px">kg</span>
      </div>

      <!-- bottom row: action buttons -->
      <div class="flex items-center justify-between">
        <!-- Later -->
        <button
          class="w-14 h-14 rounded-full flex items-center justify-center text-white"
          style="background-color: #9ca3af"
          aria-label="Later"
          @click="triggerSwipeOut('left')"
        >
          <Clock :size="22" />
        </button>

        <!-- Weight Up -->
        <button
          class="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-md"
          :style="{ backgroundColor: accent }"
          aria-label="Weight up and done"
          @click="triggerSwipeOut('up')"
        >
          <ArrowUp :size="26" />
        </button>

        <!-- Done -->
        <button
          class="w-14 h-14 rounded-full flex items-center justify-center text-white"
          style="background-color: #1a1a1a"
          aria-label="Done"
          @click="triggerSwipeOut('right')"
        >
          <Check :size="22" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.swipe-left {
  transform: translateX(-120vw) rotate(-20deg) !important;
  transition: transform 300ms ease-in !important;
}
.swipe-right {
  transform: translateX(120vw) rotate(20deg) !important;
  transition: transform 300ms ease-in !important;
}
.swipe-up {
  transform: translateY(-120vh) !important;
  transition: transform 300ms ease-in !important;
}
</style>
