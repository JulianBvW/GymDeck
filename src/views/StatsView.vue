<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ChevronDown } from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'

const router = useRouter()
const uiStore = useUIStore()

function goBack() {
  uiStore.transitionDirection = 'down'
  router.push('/')
}
</script>

<template>
  <div class="relative h-full overflow-hidden bg-white flex flex-col">
    <div class="flex items-center px-5 py-4">
      <button
        class="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-800 rounded-full"
        aria-label="Back"
        @click="goBack"
      >
        <ChevronDown :size="22" />
      </button>
      <span class="ml-2 font-semibold text-gray-900">Stats</span>
    </div>
    <div class="flex-1 flex items-center justify-center text-gray-400 text-sm">
      Coming soon
    </div>
  </div>
</template>
