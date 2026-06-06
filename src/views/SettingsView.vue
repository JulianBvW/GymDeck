<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import WaveBackground from '@/components/WaveBackground.vue'
import MachineEditor from '@/components/MachineEditor.vue'
import FitnessCheckEditor from '@/components/FitnessCheckEditor.vue'
import { useUIStore } from '@/stores/ui'
import { useMachinesStore } from '@/stores/machines'
import { useSessionsStore } from '@/stores/sessions'
import { useFitnessStore } from '@/stores/fitness'
import { useDailyPalette } from '@/composables/useDailyPalette'

const router = useRouter()
const uiStore = useUIStore()
const machinesStore = useMachinesStore()
const sessionsStore = useSessionsStore()
const fitnessStore = useFitnessStore()
const palette = useDailyPalette()

const doneCount = computed(() => sessionsStore.todaySession?.machinesDone.length ?? 0)
const progress = computed(() =>
  machinesStore.machines.length === 0 ? 0 : doneCount.value / machinesStore.machines.length
)

const newlyAddedMachineId = ref<string | null>(null)
const newlyAddedCheckId = ref<string | null>(null)

function goBack() {
  uiStore.transitionDirection = 'left'
  router.back()
}

function addMachine() {
  const id = machinesStore.addMachine({
    name: 'New Machine',
    locationX: 0.5,
    locationY: 0.5,
    currentWeight: 0,
    stepSize: 2.5,
  })
  newlyAddedMachineId.value = id
}

function addCheck() {
  const id = fitnessStore.addCheck({ name: 'New Check', unit: 'reps', stepSize: 1, min: 0, max: 100 })
  newlyAddedCheckId.value = id
}
</script>

<template>
  <div class="relative h-full overflow-hidden bg-[#faf9f7] flex flex-col">
    <WaveBackground
      :progress="progress"
      :wave1="palette.wave1"
      :wave2="palette.wave2"
      :wave3="palette.wave3"
    />

    <div
      class="relative z-10 flex-1 overflow-y-auto pt-4 pb-8 px-5 flex flex-col gap-8"
      style="overscroll-behavior-y: contain"
    >
      <!-- Header -->
      <div class="flex flex-col gap-0 cursor-pointer touch-manipulation" @click="goBack">
        <div class="flex items-center justify-between">
          <span class="font-semibold tracking-widest text-[10px] text-gray-600 uppercase">Settings</span>
          <div class="w-9 h-9 flex items-center justify-center text-gray-500 rounded-full">
            <ChevronLeft :size="22" />
          </div>
        </div>
        <h1 class="-mt-2 text-2xl font-bold text-gray-900">Your gym</h1>
      </div>

      <!-- Machines -->
      <div>
        <p class="text-xs font-semibold tracking-widest text-gray-600 uppercase mb-2 px-1">Machines</p>
        <div class="flex flex-col gap-2">
          <MachineEditor
            v-for="machine in machinesStore.machines"
            :key="machine.id"
            :machine-id="machine.id"
            :start-open="machine.id === newlyAddedMachineId"
          />
        </div>
        <button
          class="mt-3 w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-500 bg-white/80 touch-manipulation"
          @click="addMachine"
        >
          + Add Machine
        </button>
      </div>

      <!-- Fitness Checks -->
      <div>
        <p class="text-xs font-semibold tracking-widest text-gray-600 uppercase mb-2 px-1">Fitness Checks</p>
        <div class="flex flex-col gap-2">
          <FitnessCheckEditor
            v-for="check in fitnessStore.checks"
            :key="check.id"
            :check-id="check.id"
            :start-open="check.id === newlyAddedCheckId"
          />
        </div>
        <button
          class="mt-3 w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-500 bg-white/80 touch-manipulation"
          @click="addCheck"
        >
          + Add Fitness Check
        </button>
      </div>

      <!-- Data (Part 3) -->
      <div>
        <p class="text-xs font-semibold tracking-widest text-gray-600 uppercase mb-2 px-1">Data</p>
        <div class="h-12 flex items-center justify-center text-sm text-gray-300 bg-white rounded-2xl shadow-sm">
          Coming soon
        </div>
      </div>
    </div>
  </div>
</template>
