<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUp } from 'lucide-vue-next'
import { useSessionsStore } from '@/stores/sessions'
import { formatDayMonth } from '@/utils/date'

const sessionsStore = useSessionsStore()

// Spread before sorting: validSessions is a computed, and .sort() would reorder
// its cached array in place for every other consumer.
const rows = computed(() =>
  [...sessionsStore.validSessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((s) => ({
      date: s.date,
      machineCount: s.machinesDone.length,
      increaseCount: s.machinesDone.filter((e) => e.weightIncreased).length,
    })),
)
</script>

<template>
  <!-- shrink-0: this card is the only child of StatsView's flex column with its own
       overflow, so without it the column hands all negative free space to this card
       and collapses it to a sliver instead of scrolling the page. -->
  <div class="shrink-0">
    <p class="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2 px-1">
      Training log
    </p>

    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div
        v-if="rows.length === 0"
        class="h-16 flex items-center justify-center text-sm text-gray-400"
      >
        No sessions yet
      </div>

      <template v-else>
        <!-- Header sits outside the scroll area so it stays put without needing
             a sticky element with its own background. -->
        <div
          class="flex items-center px-4 py-2 border-b border-gray-100 text-[10px] font-semibold tracking-widest text-gray-400 uppercase"
        >
          <span class="w-16 shrink-0">Date</span>
          <span class="flex-1 text-right">Machines</span>
          <span class="w-20 text-right">Increases</span>
        </div>

        <div class="log-scroll overflow-y-auto">
          <div
            v-for="(row, index) in rows"
            :key="row.date"
            class="flex items-center px-4 py-3"
            :class="{ 'border-t border-gray-100': index > 0 }"
          >
            <span class="w-16 shrink-0 text-sm font-semibold text-gray-900">
              {{ formatDayMonth(row.date) }}
            </span>
            <span class="flex-1 text-right text-sm text-gray-400">{{ row.machineCount }}</span>
            <span class="w-20 text-right text-sm text-gray-400">
              <template v-if="row.increaseCount > 0">
                <span class="inline-flex items-center gap-0.5 text-gray-900">
                  {{ row.increaseCount }}<ArrowUp :size="12" />
                </span>
              </template>
              <template v-else>—</template>
            </span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* Deliberately not a multiple of the 44px row height — clipping the last row
   mid-way is the only hint that the list continues. */
.log-scroll {
  max-height: 250px;
}
</style>
