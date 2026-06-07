<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import LocationPicker from '@/components/LocationPicker.vue'
import { useMachinesStore } from '@/stores/machines'
import { useDailyPalette } from '@/composables/useDailyPalette'

const props = defineProps<{
  machineId: string
  startOpen?: boolean
}>()

const machinesStore = useMachinesStore()
const palette = useDailyPalette()

const machine = computed(() => machinesStore.machines.find(m => m.id === props.machineId))

const expanded = ref(props.startOpen ?? false)
watch(() => props.startOpen, (v) => { if (v) expanded.value = true })

const localName = ref(machine.value?.name ?? '')
const localWeight = ref(machine.value?.currentWeight ?? 0)
const localStep = ref(machine.value?.stepSize ?? 2.5)
const localX = ref(machine.value?.locationX ?? 0.5)
const localY = ref(machine.value?.locationY ?? 0.5)

const isDirty = computed(() =>
  machine.value !== undefined && (
    localName.value !== machine.value.name ||
    localWeight.value !== machine.value.currentWeight ||
    localStep.value !== machine.value.stepSize ||
    localX.value !== machine.value.locationX ||
    localY.value !== machine.value.locationY
  )
)

const saving = ref(false)
const confirmingDelete = ref(false)
let deleteTimer: ReturnType<typeof setTimeout> | null = null

function toggleExpand() {
  expanded.value = !expanded.value
  if (!expanded.value) {
    confirmingDelete.value = false
    if (deleteTimer !== null) {
      clearTimeout(deleteTimer)
      deleteTimer = null
    }
  }
}

function onLocationUpdate(pos: { x: number; y: number }) {
  localX.value = pos.x
  localY.value = pos.y
}

function save() {
  if (!machine.value || !isDirty.value) return
  machinesStore.updateMachine(props.machineId, {
    name: localName.value.trim() || machine.value.name,
    currentWeight: Number.isFinite(localWeight.value) ? localWeight.value : machine.value.currentWeight,
    stepSize: Number.isFinite(localStep.value) && localStep.value > 0 ? localStep.value : machine.value.stepSize,
    locationX: localX.value,
    locationY: localY.value,
  })
  saving.value = true
  setTimeout(() => {
    saving.value = false
    expanded.value = false
  }, 300)
}

function onDelete() {
  if (!confirmingDelete.value) {
    confirmingDelete.value = true
    deleteTimer = setTimeout(() => { confirmingDelete.value = false }, 3000)
  } else {
    if (deleteTimer !== null) clearTimeout(deleteTimer)
    machinesStore.deleteMachine(props.machineId)
  }
}

onUnmounted(() => {
  if (deleteTimer !== null) clearTimeout(deleteTimer)
})
</script>

<template>
  <div v-if="machine" class="bg-white rounded-2xl shadow-sm overflow-hidden">
    <!-- Collapsed row -->
    <button
      class="w-full flex items-center justify-between px-4 py-3 text-left touch-manipulation"
      @click="toggleExpand"
    >
      <span class="text-sm font-semibold text-gray-900">{{ machine.name }}</span>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-400">{{ machine.currentWeight }} kg</span>
        <ChevronDown
          :size="18"
          class="text-gray-400 transition-transform duration-300"
          :class="{ 'rotate-180': expanded }"
        />
      </div>
    </button>

    <!-- Expandable body -->
    <div class="editor-body" :class="{ 'is-open': expanded }">
      <div class="px-4 pt-3 pb-4 border-t border-gray-100 flex flex-col gap-4">
        <!-- Location picker + fields -->
        <div class="flex gap-3">
          <LocationPicker
            :model-value="{ x: localX, y: localY }"
            :accent="palette.accent"
            @update:model-value="onLocationUpdate"
          />
          <div class="flex-1 flex flex-col gap-2 min-w-0">
            <div class="flex flex-col gap-1">
              <label class="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Name</label>
              <input
                v-model="localName"
                type="text"
                class="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400"
              />
            </div>
            <div class="flex gap-2">
              <div class="flex-1 flex flex-col gap-1">
                <label class="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Weight</label>
                <input
                  v-model.number="localWeight"
                  type="number"
                  inputmode="decimal"
                  class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400"
                />
              </div>
              <div class="flex-1 flex flex-col gap-1">
                <label class="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Step</label>
                <input
                  v-model.number="localStep"
                  type="number"
                  inputmode="decimal"
                  class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Save + Delete -->
        <div class="flex gap-2">
          <button
            class="flex-1 py-2 rounded-xl text-sm font-semibold"
            :class="saving ? 'save-flash' : isDirty ? 'text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'"
            :style="!saving && isDirty ? { backgroundColor: palette.accent } : undefined"
            :disabled="!isDirty || saving"
            @click="save"
          >
            Save
          </button>
          <button
            :key="confirmingDelete ? 'confirm' : 'idle'"
            class="px-4 py-2 rounded-xl text-sm font-semibold"
            :class="confirmingDelete ? 'delete-urgent bg-red-500 text-white' : 'bg-gray-100 text-gray-500'"
            @click="onDelete"
          >
            {{ confirmingDelete ? 'Confirm?' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}
.editor-body.is-open {
  max-height: 600px;
}

@keyframes saveFlashAnim {
  0%   { background-color: #374151; color: white; }
  100% { background-color: #e5e7eb; color: #9ca3af; }
}
.save-flash {
  animation: saveFlashAnim 280ms ease-out forwards;
}

@keyframes deleteUrgentAnim {
  0%   { transform: scale(1);    box-shadow: 0 0 0 0   rgba(239, 68, 68, 0.55); }
  50%  { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
  100% { transform: scale(1);    box-shadow: 0 0 0 0   rgba(239, 68, 68, 0); }
}
.delete-urgent {
  animation: deleteUrgentAnim 420ms ease-out both;
}
</style>
