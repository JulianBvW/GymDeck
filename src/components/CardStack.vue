<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Check, Plus } from 'lucide-vue-next'
import MachineCard from '@/components/MachineCard.vue'
import { useMachinesStore } from '@/stores/machines'
import { useSessionsStore } from '@/stores/sessions'
import { useUIStore } from '@/stores/ui'
import { useDailyPalette } from '@/composables/useDailyPalette'
import type { Machine } from '@/stores/machines'

const router = useRouter()
const machinesStore = useMachinesStore()
const sessionsStore = useSessionsStore()
const uiStore = useUIStore()
const palette = useDailyPalette()

const remainingMachines = ref<Machine[]>([])
const isSwiping = ref(false)
const isPromoting = ref(false)
const returningMachineId = ref<string | null>(null)
const returningFromLeft = ref(false)
const promotingMachineId = ref<string | null>(null)
const promotingInStartPos = ref(false)
// True only when the last card was cleared during this mount. initCards() never sets it,
// so arriving at an already-finished session — a reload, or coming back from /stats —
// shows the completion block without replaying the celebration.
const justCompleted = ref(false)

const isLastCard = computed(() => remainingMachines.value.length <= 1)

function shuffle(ids: string[]): string[] {
  const a = [...ids]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]!
    a[i] = a[j]!
    a[j] = tmp
  }
  return a
}

function initCards() {
  const doneMachineIds = new Set(
    sessionsStore.todaySession?.machinesDone.map((e) => e.machineId) ?? [],
  )
  const skippedMachineIds = new Set(sessionsStore.todaySkipped)
  // Reuse today's order if it exists; otherwise shuffle once and persist
  let orderedIds = sessionsStore.todayMachineOrder
  if (!orderedIds) {
    orderedIds = shuffle(machinesStore.machines.map((m) => m.id))
    sessionsStore.saveTodayMachineOrder(orderedIds)
  } else {
    // Machines added after today's order was saved — append them at the end
    const savedSet = new Set(orderedIds)
    const newIds = machinesStore.machines.filter((m) => !savedSet.has(m.id)).map((m) => m.id)
    if (newIds.length > 0) {
      orderedIds = [...orderedIds, ...newIds]
      sessionsStore.saveTodayMachineOrder(orderedIds)
    }
  }
  remainingMachines.value = orderedIds
    .map((id) => machinesStore.machines.find((m) => m.id === id))
    .filter((m): m is Machine => m !== undefined)
    .filter((m) => !doneMachineIds.has(m.id) && !skippedMachineIds.has(m.id))
}

function goToSettings() {
  uiStore.transitionDirection = 'right'
  router.push('/settings')
}

function goToStats() {
  uiStore.transitionDirection = 'up'
  router.push('/stats')
}

onMounted(initCards)

const visibleMachines = computed(() => {
  const base = remainingMachines.value.slice(0, 3)
  if (returningMachineId.value) {
    const returning = remainingMachines.value.find((m) => m.id === returningMachineId.value)
    if (returning && !base.includes(returning)) return [...base, returning]
  }
  return base
})

const springTransition = { transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)' }

function cardWrapperStyle(index: number, machineId: string) {
  // Returning card: fly in from the left to its peeking position.
  // Always targets the 2nd-peek slot visually, except when only 2 cards remain (index 1).
  if (machineId === returningMachineId.value) {
    const peek1 = index === 1
    const target = peek1 ? 'translateY(36px) scale(0.93)' : 'translateY(74px) scale(0.86)'
    return {
      transform: returningFromLeft.value ? `translateX(-150%) ${target}` : target,
      transformOrigin: 'top center',
      zIndex: peek1 ? 1 : index === 2 ? 0 : -1,
      pointerEvents: 'none' as const,
      transition: returningFromLeft.value
        ? 'none'
        : 'transform 450ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    }
  }

  // Promoting card: explicit FLIP so the "from" transform is committed to the DOM
  // before we animate — needed because Vue may move the element in the DOM (2-card case)
  // which would otherwise discard the browser's remembered "from" value.
  if (machineId === promotingMachineId.value && index === 0) {
    if (promotingInStartPos.value) {
      return {
        zIndex: 2,
        transform: 'translateY(36px) scale(0.93)',
        transformOrigin: 'top center' as const,
        transition: 'none',
      }
    }
    return { zIndex: 2, transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)' }
  }

  const promoting = isPromoting.value ? springTransition : {}
  if (index === 0) return { zIndex: 2, ...promoting }
  if (index === 1)
    return {
      transform: 'translateY(36px) scale(0.93)',
      transformOrigin: 'top center',
      zIndex: 1,
      pointerEvents: 'none' as const,
      ...promoting,
    }
  return {
    transform: 'translateY(74px) scale(0.86)',
    transformOrigin: 'top center',
    zIndex: 0,
    pointerEvents: 'none' as const,
    ...promoting,
  }
}

function removeTopCard() {
  isPromoting.value = true
  remainingMachines.value.shift()
  // Skipping every card also empties the deck, but "0 machines" is not worth a
  // celebration — require something actually logged.
  if (remainingMachines.value.length === 0 && doneCount.value > 0) {
    justCompleted.value = true
  }
  setTimeout(() => {
    isPromoting.value = false
  }, 350)
}

function onDone() {
  const machine = remainingMachines.value[0]
  if (!machine) return
  sessionsStore.logEntry({
    machineId: machine.id,
    weight: machine.currentWeight,
    weightIncreased: false,
  })
  removeTopCard()
}

function onWeightUp() {
  const machine = remainingMachines.value[0]
  if (!machine) return
  const weight = machine.currentWeight
  sessionsStore.logEntry({ machineId: machine.id, weight, weightIncreased: true })
  machinesStore.updateMachine(machine.id, { currentWeight: weight + machine.stepSize })
  removeTopCard()
}

async function onLater() {
  const machine = remainingMachines.value[0]
  if (!machine) return
  const newTop = remainingMachines.value[1]

  returningMachineId.value = machine.id
  returningFromLeft.value = true
  // Track the card that will become the new top so we can FLIP-animate it
  if (newTop) {
    promotingMachineId.value = newTop.id
    promotingInStartPos.value = true
  }

  remainingMachines.value.push(machine)
  removeTopCard()
  await nextTick()
  // Double rAF: browser commits the "from" state for both animations before we trigger transitions
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      returningFromLeft.value = false
      promotingInStartPos.value = false
      setTimeout(() => {
        returningMachineId.value = null
        promotingMachineId.value = null
      }, 500)
    })
  })
}

function onSkip() {
  const machine = remainingMachines.value[0]
  if (!machine) return
  sessionsStore.skipMachineToday(machine.id)
  removeTopCard()
}

const doneCount = computed(() => sessionsStore.todaySession?.machinesDone.length ?? 0)
const weightIncreaseCount = computed(
  () => sessionsStore.todaySession?.machinesDone.filter((e) => e.weightIncreased).length ?? 0,
)

// Vue wraps the expose object in proxyRefs, so the parent reads this as a plain
// boolean: cardStackRef.value.isSwiping — not .isSwiping.value
defineExpose({ isSwiping })
</script>

<template>
  <div class="relative z-0" style="width: min(80vw, 360px); height: min(80vw, 360px)">
    <!-- No machines configured -->
    <div
      v-if="machinesStore.machines.length === 0"
      class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6"
    >
      <div class="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center">
        <Plus :size="28" :style="{ color: palette.wave1 }" />
      </div>
      <p class="font-bold text-gray-900 text-xl">No machines yet</p>
      <button
        class="mt-1 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white touch-manipulation"
        :style="{ backgroundColor: palette.wave1 }"
        @click="goToSettings"
      >
        Add in Settings →
      </button>
    </div>

    <!-- Session complete -->
    <div
      v-else-if="remainingMachines.length === 0"
      class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6"
    >
      <div class="relative">
        <!-- One ring, once — punctuation for the moment the deck runs out -->
        <div
          v-if="justCompleted"
          class="absolute inset-0 rounded-full pointer-events-none ring-pulse"
          :style="{ '--ring-color': palette.accent }"
        />
        <div
          class="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center"
          :class="{ 'check-pop-in': justCompleted }"
        >
          <Check :size="28" :style="{ color: palette.accent }" />
        </div>
      </div>
      <h2 class="font-bold text-gray-900 text-xl" :class="{ 'reveal reveal-1': justCompleted }">
        Session complete
      </h2>
      <p class="text-gray-500 text-sm" :class="{ 'reveal reveal-2': justCompleted }">
        {{ doneCount }} machines · {{ weightIncreaseCount }} weight increases
      </p>
      <button
        class="mt-1 px-5 py-2.5 rounded-2xl text-sm font-semibold bg-gray-900 text-white touch-manipulation"
        :class="{ 'reveal reveal-3': justCompleted }"
        @click="goToStats"
      >
        See statistics
      </button>
    </div>

    <!-- Card stack -->
    <template v-else-if="remainingMachines.length > 0">
      <div
        v-for="(machine, index) in visibleMachines"
        :key="machine.id"
        class="absolute left-0 right-0 top-0"
        :style="cardWrapperStyle(index, machine.id)"
      >
        <MachineCard
          :machine="machine"
          :accent="palette.accent"
          :disable-later="isLastCard"
          @done="onDone"
          @weight-up="onWeightUp"
          @later="onLater"
          @skip="onSkip"
          @swipe-start="isSwiping = true"
          @swipe-end="isSwiping = false"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
@keyframes checkPopIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
.check-pop-in {
  animation: checkPopIn 450ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

/* Copied from FitnessCard.vue — scoped styles cannot be shared, and the project
   already duplicates keyframes this way across the two editor components. */
@keyframes ringPulse {
  0% {
    transform: scale(1);
    opacity: 0.75;
  }
  100% {
    transform: scale(2.6);
    opacity: 0;
  }
}
.ring-pulse {
  border: 2px solid var(--ring-color, currentColor);
  animation: ringPulse 500ms ease-out forwards;
}

/* Staggered reveal. `both` is required: without it each element is visible during
   its own delay and flashes before animating. */
@keyframes revealUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.reveal {
  animation: revealUp 320ms cubic-bezier(0.4, 0, 0.2, 1) both;
}
.reveal-1 {
  animation-delay: 80ms;
}
.reveal-2 {
  animation-delay: 160ms;
}
.reveal-3 {
  animation-delay: 240ms;
}
</style>
