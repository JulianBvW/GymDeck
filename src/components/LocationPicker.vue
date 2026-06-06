<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  modelValue: { x: number; y: number }
  accent: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: { x: number; y: number }]
}>()

const el = ref<HTMLElement | null>(null)

function positionFromClient(clientX: number, clientY: number) {
  if (!el.value) return
  const rect = el.value.getBoundingClientRect()
  const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
  emit('update:modelValue', { x, y })
}

function onClick(e: MouseEvent) {
  positionFromClient(e.clientX, e.clientY)
}

function onTouchEnd(e: TouchEvent) {
  const t = e.changedTouches[0]
  if (t) positionFromClient(t.clientX, t.clientY)
}
</script>

<template>
  <div
    ref="el"
    class="w-28 h-28 rounded-xl bg-gray-100 relative cursor-crosshair select-none flex-shrink-0"
    @click="onClick"
    @touchend.prevent="onTouchEnd"
  >
    <div
      class="w-3 h-3 rounded-full absolute pointer-events-none"
      :style="{
        backgroundColor: accent,
        left: `${modelValue.x * 100}%`,
        top: `${modelValue.y * 100}%`,
        transform: 'translate(-50%, -50%)',
      }"
    />
  </div>
</template>
