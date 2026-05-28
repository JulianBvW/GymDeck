<script setup lang="ts">
import { X, Clock, ArrowUp, Check } from 'lucide-vue-next'
import LocationPulse from '@/components/LocationPulse.vue'
import type { Machine } from '@/stores/machines'

defineProps<{
  machine: Machine
  accent: string
}>()
</script>

<template>
  <div
    class="relative bg-white overflow-hidden shadow-xl"
    style="width: min(80vw, 360px); height: min(80vw, 360px); border-radius: 28px; flex-shrink: 0;"
  >
    <!-- background rings layer -->
    <LocationPulse :x="machine.locationX" :y="machine.locationY" :accent="accent" />

    <!-- card content -->
    <div class="relative z-10 flex flex-col h-full p-5">

      <!-- top row: name + skip -->
      <div class="flex items-start justify-between">
        <span class="font-bold text-lg text-gray-900 leading-tight max-w-[75%]">
          {{ machine.name }}
        </span>
        <button
          class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full"
          aria-label="Skip for today"
        >
          <X :size="18" />
        </button>
      </div>

      <!-- middle: weight display -->
      <div class="flex-1 flex items-center justify-center gap-1.5">
        <span class="font-bold text-gray-900 leading-none" style="font-size: 56px;">
          {{ machine.currentWeight }}
        </span>
        <span class="text-gray-400 font-normal self-end mb-2" style="font-size: 18px;">
          kg
        </span>
      </div>

      <!-- bottom row: action buttons -->
      <div class="flex items-center justify-around">

        <!-- Later -->
        <button
          class="w-14 h-14 rounded-full flex items-center justify-center text-white"
          style="background-color: #9ca3af;"
          aria-label="Later"
        >
          <Clock :size="22" />
        </button>

        <!-- Weight Up + Done (center, slightly larger) -->
        <button
          class="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-md"
          :style="{ backgroundColor: accent }"
          aria-label="Weight up and done"
        >
          <ArrowUp :size="26" />
        </button>

        <!-- Done -->
        <button
          class="w-14 h-14 rounded-full flex items-center justify-center text-white"
          style="background-color: #1a1a1a;"
          aria-label="Done"
        >
          <Check :size="22" />
        </button>

      </div>
    </div>
  </div>
</template>
