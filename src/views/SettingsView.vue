<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import WaveBackground from '@/components/WaveBackground.vue'
import MachineEditor from '@/components/MachineEditor.vue'
import FitnessCheckEditor from '@/components/FitnessCheckEditor.vue'
import { useUIStore } from '@/stores/ui'
import { useMachinesStore } from '@/stores/machines'
import type { Machine } from '@/stores/machines'
import { useSessionsStore } from '@/stores/sessions'
import type { Session } from '@/stores/sessions'
import { useFitnessStore } from '@/stores/fitness'
import type { FitnessCheck, FitnessMeasurement } from '@/stores/fitness'
import { useDailyPalette } from '@/composables/useDailyPalette'
import { toDateString } from '@/utils/date'

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

// Empty name marks the entry as "new" — the editor shows placeholders and
// falls back to these defaults on save.
function addMachine() {
  const id = machinesStore.addMachine({
    name: '',
    locationX: 0.5,
    locationY: 0.5,
    currentWeight: 0,
    stepSize: 2.5,
  })
  newlyAddedMachineId.value = id
}

function addCheck() {
  const id = fitnessStore.addCheck({ name: '', unit: '', stepSize: 1, min: 0, max: 100 })
  newlyAddedCheckId.value = id
}

// --- Data export / import ---

interface ImportPayload {
  machines: Machine[]
  sessions: Session[]
  fitnessChecks: FitnessCheck[]
  fitnessMeasurements: FitnessMeasurement[]
}

function isValidImport(obj: unknown): obj is ImportPayload {
  if (typeof obj !== 'object' || obj === null) return false
  const o = obj as Record<string, unknown>
  const isObjArray = (v: unknown) => Array.isArray(v) && v.every(item => typeof item === 'object' && item !== null)
  return (
    isObjArray(o['machines']) &&
    isObjArray(o['sessions']) &&
    isObjArray(o['fitnessChecks']) &&
    isObjArray(o['fitnessMeasurements'])
  )
}

const fileInput = ref<HTMLInputElement | null>(null)
const importPayload = ref<ImportPayload | null>(null)
const confirmingImport = ref(false)
const importError = ref<string | null>(null)

function formatExportDate(date: string): string {
  return date.slice(8, 10) + '.' + date.slice(5, 7) + '.' + date.slice(0, 4)
}

function exportData() {
  const dateStr = toDateString(new Date())
  const payload = {
    machines: machinesStore.machines,
    sessions: sessionsStore.sessions,
    fitnessChecks: fitnessStore.checks,
    fitnessMeasurements: fitnessStore.measurements,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gymdeck-backup-${dateStr}.json`
  a.click()
  URL.revokeObjectURL(url)
  uiStore.lastExportDate = dateStr
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const parsed: unknown = JSON.parse(ev.target?.result as string)
      if (!isValidImport(parsed)) {
        importError.value = 'Invalid backup file — missing required data.'
        return
      }
      importPayload.value = parsed
      confirmingImport.value = true
      importError.value = null
    } catch {
      importError.value = 'Could not read file — make sure it is a valid GymDeck backup.'
    }
  }
  reader.readAsText(file)
  input.value = ''
}

function confirmImport() {
  if (!importPayload.value) return
  machinesStore.machines = importPayload.value.machines
  sessionsStore.sessions = importPayload.value.sessions
  sessionsStore.clearMachineOrder()
  fitnessStore.checks = importPayload.value.fitnessChecks
  fitnessStore.measurements = importPayload.value.fitnessMeasurements
  importPayload.value = null
  confirmingImport.value = false
}

function cancelImport() {
  importPayload.value = null
  confirmingImport.value = false
  importError.value = null
}

const confirmingReset = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | null = null

function onReset() {
  if (!confirmingReset.value) {
    confirmingReset.value = true
    resetTimer = setTimeout(() => { confirmingReset.value = false }, 3000)
  } else {
    if (resetTimer !== null) clearTimeout(resetTimer)
    machinesStore.machines = []
    sessionsStore.sessions = []
    sessionsStore.clearMachineOrder()
    fitnessStore.checks = []
    fitnessStore.measurements = []
    confirmingReset.value = false
    resetTimer = null
  }
}

onUnmounted(() => {
  if (resetTimer !== null) clearTimeout(resetTimer)
})
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
      class="relative z-10 flex-1 overflow-y-auto px-5 flex flex-col gap-8"
      style="padding-top: calc(1rem + env(safe-area-inset-top)); padding-bottom: calc(2rem + env(safe-area-inset-bottom)); overscroll-behavior-y: contain"
    >
      <!-- Header -->
      <div class="flex flex-col gap-0 cursor-pointer touch-manipulation" @click="goBack">
        <div class="flex items-center justify-between">
          <span class="font-semibold tracking-widest text-[10px] text-gray-600 uppercase">Settings</span>
          <div class="w-11 h-11 flex items-center justify-center text-gray-500 rounded-full">
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

      <!-- Data -->
      <div>
        <p class="text-xs font-semibold tracking-widest text-gray-600 uppercase mb-2 px-1">Data</p>
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
          <!-- Export row -->
          <div class="flex items-center justify-between px-4 py-3">
            <div class="flex flex-col gap-0.5">
              <span class="text-sm font-semibold text-gray-900">Export</span>
              <span v-if="uiStore.lastExportDate" class="text-xs text-gray-400">
                Last: {{ formatExportDate(uiStore.lastExportDate) }}
              </span>
            </div>
            <button
              class="px-4 py-2 rounded-xl text-sm font-semibold text-white touch-manipulation"
              :style="{ backgroundColor: palette.accent }"
              @click="exportData"
            >
              Export
            </button>
          </div>

          <!-- Import row -->
          <div class="border-t border-gray-100 px-4 py-3">
            <div v-if="!confirmingImport" class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-900">Import</span>
              <button
                class="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 touch-manipulation"
                @click="fileInput?.click()"
              >
                Import
              </button>
            </div>
            <div v-else class="flex flex-col gap-2">
              <p class="text-sm text-gray-600">This will overwrite all data.</p>
              <div class="flex gap-2">
                <button
                  class="flex-1 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 touch-manipulation"
                  @click="cancelImport"
                >
                  Cancel
                </button>
                <button
                  class="flex-1 py-2 rounded-xl text-sm font-semibold text-white touch-manipulation"
                  style="background-color: #ef4444"
                  @click="confirmImport"
                >
                  Confirm
                </button>
              </div>
            </div>
            <p v-if="importError" class="mt-2 text-xs text-red-500">{{ importError }}</p>
          </div>

          <!-- Reset row -->
          <div class="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
            <div class="flex flex-col gap-0.5">
              <span class="text-sm font-semibold text-gray-900">Reset</span>
              <span class="text-xs text-gray-400">Wipe all data permanently</span>
            </div>
            <button
              :key="confirmingReset ? 'confirm' : 'idle'"
              class="px-4 py-2 rounded-xl text-sm font-semibold touch-manipulation transition-colors duration-200"
              :class="confirmingReset ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'"
              @click="onReset"
            >
              {{ confirmingReset ? 'Confirm?' : 'Reset' }}
            </button>
          </div>
        </div>

        <input
          ref="fileInput"
          type="file"
          accept=".json"
          class="hidden"
          @change="onFileSelected"
        />
      </div>
    </div>
  </div>
</template>
