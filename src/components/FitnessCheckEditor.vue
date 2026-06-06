<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { useFitnessStore } from '@/stores/fitness'
import { useDailyPalette } from '@/composables/useDailyPalette'

const props = defineProps<{
  checkId: string
  startOpen?: boolean
}>()

const fitnessStore = useFitnessStore()
const palette = useDailyPalette()

const check = computed(() => fitnessStore.checks.find(c => c.id === props.checkId))

const expanded = ref(props.startOpen ?? false)
watch(() => props.startOpen, (v) => { if (v) expanded.value = true })

const localName = ref(check.value?.name ?? '')
const localUnit = ref(check.value?.unit ?? '')
const localStep = ref(check.value?.stepSize ?? 1)
const localMin = ref(check.value?.min ?? 0)
const localMax = ref(check.value?.max ?? 100)

const isDirty = computed(() =>
  check.value !== undefined && (
    localName.value !== check.value.name ||
    localUnit.value !== check.value.unit ||
    localStep.value !== check.value.stepSize ||
    localMin.value !== (check.value.min ?? 0) ||
    localMax.value !== (check.value.max ?? 100)
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

function save() {
  if (!check.value || !isDirty.value) return
  fitnessStore.updateCheck(props.checkId, {
    name: localName.value.trim() || check.value.name,
    unit: localUnit.value.trim() || check.value.unit,
    stepSize: Number.isFinite(localStep.value) && localStep.value > 0 ? localStep.value : check.value.stepSize,
    min: Number.isFinite(localMin.value) ? localMin.value : check.value.min,
    max: Number.isFinite(localMax.value) ? localMax.value : check.value.max,
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
    fitnessStore.deleteCheck(props.checkId)
  }
}

onUnmounted(() => {
  if (deleteTimer !== null) clearTimeout(deleteTimer)
})
</script>

<template>
  <div v-if="check" class="bg-white rounded-2xl shadow-sm overflow-hidden">
    <!-- Collapsed row -->
    <button
      class="w-full flex items-center justify-between px-4 py-3 text-left touch-manipulation"
      @click="toggleExpand"
    >
      <span class="text-sm font-semibold text-gray-900">{{ check.name }}</span>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-400">{{ check.unit }}</span>
        <ChevronDown
          :size="18"
          class="text-gray-400 transition-transform duration-300"
          :class="{ 'rotate-180': expanded }"
        />
      </div>
    </button>

    <!-- Expandable body -->
    <div class="editor-body" :class="{ 'is-open': expanded }">
      <div class="px-4 pt-3 pb-4 border-t border-gray-100 flex flex-col gap-3">
        <!-- Name + Unit -->
        <div class="flex gap-2">
          <div class="flex-1 flex flex-col gap-1">
            <label class="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Name</label>
            <input
              v-model="localName"
              type="text"
              class="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400"
            />
          </div>
          <div class="w-24 flex flex-col gap-1">
            <label class="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Unit</label>
            <input
              v-model="localUnit"
              type="text"
              class="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400"
            />
          </div>
        </div>

        <!-- Step + Min + Max -->
        <div class="flex gap-2">
          <div class="flex-1 flex flex-col gap-1">
            <label class="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Step</label>
            <input
              v-model.number="localStep"
              type="number"
              inputmode="decimal"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400"
            />
          </div>
          <div class="flex-1 flex flex-col gap-1">
            <label class="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Min</label>
            <input
              v-model.number="localMin"
              type="number"
              inputmode="decimal"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400"
            />
          </div>
          <div class="flex-1 flex flex-col gap-1">
            <label class="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Max</label>
            <input
              v-model.number="localMax"
              type="number"
              inputmode="decimal"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400"
            />
          </div>
        </div>

        <!-- Save + Delete -->
        <div class="flex gap-2">
          <button
            class="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors duration-150"
            :class="isDirty ? 'text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'"
            :style="isDirty ? { backgroundColor: palette.accent, filter: saving ? 'brightness(0.78)' : undefined } : undefined"
            :disabled="!isDirty"
            @click="save"
          >
            Save
          </button>
          <button
            class="px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200"
            :class="confirmingDelete ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'"
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
  max-height: 400px;
}
</style>
