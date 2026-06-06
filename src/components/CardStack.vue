<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import MachineCard from '@/components/MachineCard.vue'
import { useMachinesStore } from '@/stores/machines'
import { useSessionsStore } from '@/stores/sessions'
import { useDailyPalette } from '@/composables/useDailyPalette'
import type { Machine } from '@/stores/machines'

const machinesStore = useMachinesStore()
const sessionsStore = useSessionsStore()
const palette = useDailyPalette()

const remainingMachines = ref<Machine[]>([])
const isSwiping = ref(false)
const isPromoting = ref(false)
const returningMachineId = ref<string | null>(null)
const returningFromLeft = ref(false)
const promotingMachineId = ref<string | null>(null)
const promotingInStartPos = ref(false)

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

onMounted(() => {
  const doneMachineIds = new Set(
    sessionsStore.todaySession?.machinesDone.map((e) => e.machineId) ?? [],
  )
  // Reuse today's order if it exists; otherwise shuffle once and persist
  let orderedIds = sessionsStore.todayMachineOrder
  if (!orderedIds) {
    orderedIds = shuffle(machinesStore.machines.map((m) => m.id))
    sessionsStore.saveTodayMachineOrder(orderedIds)
  } else {
    // Machines added after today's order was saved — append them at the end
    const savedSet = new Set(orderedIds)
    const newIds = machinesStore.machines.filter(m => !savedSet.has(m.id)).map(m => m.id)
    if (newIds.length > 0) {
      orderedIds = [...orderedIds, ...newIds]
      sessionsStore.saveTodayMachineOrder(orderedIds)
    }
  }
  remainingMachines.value = orderedIds
    .map((id) => machinesStore.machines.find((m) => m.id === id))
    .filter((m): m is Machine => m !== undefined)
    .filter((m) => !doneMachineIds.has(m.id))
})

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
      transition: returningFromLeft.value ? 'none' : 'transform 450ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    }
  }

  // Promoting card: explicit FLIP so the "from" transform is committed to the DOM
  // before we animate — needed because Vue may move the element in the DOM (2-card case)
  // which would otherwise discard the browser's remembered "from" value.
  if (machineId === promotingMachineId.value && index === 0) {
    if (promotingInStartPos.value) {
      return { zIndex: 2, transform: 'translateY(36px) scale(0.93)', transformOrigin: 'top center' as const, transition: 'none' }
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
  setTimeout(() => {
    isPromoting.value = false
  }, 350)
}

function onDone() {
  const machine = remainingMachines.value[0]
  if (!machine) return
  sessionsStore.logEntry({ machineId: machine.id, weight: machine.currentWeight, weightIncreased: false })
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
  removeTopCard()
}

const doneCount = computed(() => sessionsStore.todaySession?.machinesDone.length ?? 0)
const weightIncreaseCount = computed(
  () => sessionsStore.todaySession?.machinesDone.filter((e) => e.weightIncreased).length ?? 0,
)

// Exposes the Ref<boolean> itself. Parent must access as cardStackRef.value.isSwiping.value
defineExpose({ isSwiping })
</script>

<template>
  <div class="relative z-0" style="width: min(80vw, 360px); height: min(80vw, 360px)">
    <!-- Session complete -->
    <div
      v-if="remainingMachines.length === 0"
      class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center"
    >
      <span style="font-size: 48px">🎉</span>
      <p class="font-bold text-gray-900 text-xl">All done!</p>
      <p class="text-gray-500 text-sm">
        {{ doneCount }} machines · {{ weightIncreaseCount }} weight increases
      </p>
    </div>

    <!-- Card stack -->
    <template v-else>
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
