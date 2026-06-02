Phase 4 — StatsView

Context

Phase 3 is complete. The Main → Stats slide-up transition and the Stats back button already work. WaveBackground already supports flip. The sessions store already exposes currentStreak and totalSessions. This phase fills in the StatsView body: layout shell with flipped waves,
quick stats row, year heatmap, and per-machine weight charts.

---

Already done — no re-implementation needed

- Main → Stats slide-up transition ✅
- Stats back button (transitionDirection = 'down', router.push('/')) ✅
- WaveBackground flip prop ✅
- sessionsStore.currentStreak, sessionsStore.totalSessions ✅

---

Part 1 — StatsView layout shell + flipped waves

File: src/views/StatsView.vue

Full-page wrapper with WaveBackground (flip) fixed at ~15% height, absolute header row, and a scrollable content area:

 <div class="relative h-full overflow-hidden bg-[#faf9f7] flex flex-col">
   <WaveBackground :progress="0.15" :flip="true" :wave1="palette.wave1" :wave2="palette.wave2" :wave3="palette.wave3" />

   <div class="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-4">
     <span class="font-semibold text-gray-900">Statistics</span>
     <button aria-label="Back" @click="goBack"><ChevronDown :size="22" /></button>
   </div>

   <div class="relative z-10 flex-1 overflow-y-auto pt-16 pb-8 px-5 flex flex-col gap-6">
     <!-- Parts 2, 3, 4 here -->
   </div>
 </div>

Imports: WaveBackground, useDailyPalette, ChevronDown, useUIStore, useRouter.

---

Part 2 — Quick stats row (3 cards)

File: src/views/StatsView.vue

const sessionsStore = useSessionsStore()
const machinesStore = useMachinesStore()
const totalWeight = computed(() =>
machinesStore.machines.reduce((sum, m) => sum + m.currentWeight, 0)
)

Three equal-width white cards in a flex row. Inline (no separate component):

 <div class="flex gap-3">
   <div v-for="stat in stats" class="flex-1 bg-white rounded-2xl shadow-sm py-5 flex flex-col items-center gap-1">
     <span class="text-2xl font-bold text-gray-900">{{ stat.value }}</span>
     <span class="text-xs text-gray-400 uppercase tracking-wide">{{ stat.label }}</span>
   </div>
 </div>

const stats = computed(() => [
{ value: sessionsStore.currentStreak, label: 'week streak' },
{ value: sessionsStore.totalSessions, label: 'sessions' },
{ value: totalWeight.value + ' kg', label: 'total weight' },
])

---

Part 3 — WeekHeatmap component

Files: src/components/WeekHeatmap.vue, src/views/StatsView.vue

Props

{ accent: string }
Reads sessionsStore.sessions directly (store access in component per project rules).

Week derivation

Use the same Monday-of-week logic already in sessions.ts:
function startOfWeek(dateStr: string): string { /_ same as sessions.ts _/ }

function weeksOfYear(year: number): string[] {
const jan1 = new Date(year, 0, 1)
const day = jan1.getDay()
const diff = day === 0 ? 6 : day - 1 // days back to Monday
const cursor = new Date(year, 0, 1 - diff)
const weeks: string[] = []
while (cursor.getFullYear() <= year) {
if (cursor.getFullYear() === year || cursor.getMonth() === 11)
weeks.push(toDateString(cursor))
cursor.setDate(cursor.getDate() + 7)
if (weeks.length > 53) break
}
return weeks
}

Session count per week

const sessionsByWeek = computed(() => {
const map = new Map<string, number>()
sessionsStore.sessions
.filter(s => s.machinesDone.length >= 1)
.forEach(s => {
const w = startOfWeek(s.date)
map.set(w, (map.get(w) ?? 0) + 1)
})
return map
})

Color logic

function cellColor(count: number): string {
if (count === 0) return '#e0e0e0'
if (count === 1) return hexWithOpacity(props.accent, 0.4)
if (count === 2) return hexWithOpacity(props.accent, 0.7)
return props.accent // 3+
}
Use inline alpha via CSS opacity or a helper that converts hex to rgba. Simplest: use opacity on the cell div and set background to props.accent.

Actually cleaner: use opacity style on each cell div:

 <div :style="{ backgroundColor: count > 0 ? accent : '#e0e0e0', opacity: opacityFor(count) }" />
 where opacityFor(0) = 1, opacityFor(1) = 0.4, opacityFor(2) = 0.7, opacityFor(3+) = 1 with accent color.

Month labels

Derive first column index per month, render labels above:
const monthLabels = computed(() => {
const labels: { text: string; col: number }[] = []
let lastMonth = -1
weeks.value.forEach((w, i) => {
const month = new Date(w + 'T00:00:00').getMonth()
if (month !== lastMonth) {
labels.push({ text: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month]!, col: i + 1 })
lastMonth = month
}
})
return labels
})

Template

CSS grid with repeat(N, 1fr) columns, aspect-square cells, ring on current week:

 <div class="flex flex-col gap-1">
   <div class="relative h-4">
     <span v-for="m in monthLabels" :key="m.col"
       class="absolute text-[10px] text-gray-400"
       :style="{ left: `calc(${(m.col - 1) / weeks.length} * 100%)` }">
       {{ m.text }}
     </span>
   </div>
   <div class="grid gap-0.5" :style="{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }">
     <div v-for="(w, i) in weekData" :key="w.start"
       class="aspect-square rounded-sm"
       :class="{ 'ring-1 ring-gray-500': w.isCurrent }"
       :style="{ backgroundColor: w.count > 0 ? accent : '#e0e0e0', opacity: w.count === 0 ? 1 : w.count === 1 ? 0.4 : w.count === 2 ? 0.7 : 1 }"
     />
   </div>
 </div>

---

Part 4 — WeightChart + Chart.js registration + final assembly

4a — src/main.ts — Register Chart.js globally

import { Chart, LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip } from 'chart.js'
Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip)

4b — src/components/WeightChart.vue

Props:
{ machineId: string, machineName: string, accent: string }
Reads sessionsStore.sessions directly.

Data:
const points = computed(() =>
sessionsStore.sessions
.filter(s => s.machinesDone.some(e => e.machineId === props.machineId))
.sort((a, b) => a.date.localeCompare(b.date))
.map(s => {
const entry = s.machinesDone.find(e => e.machineId === props.machineId)!
return { x: s.date.slice(5), y: entry.weight }
})
)

If points.value.length < 2 → show "Not enough data yet" (no <Line>).

Otherwise render <Line> from vue-chartjs with:
const chartData = computed(() => ({
labels: points.value.map(p => p.x),
datasets: [{
data: points.value.map(p => p.y),
borderColor: props.accent,
backgroundColor: 'transparent',
tension: 0.4,
pointRadius: 3,
}]
}))
const chartOptions = {
responsive: true,
maintainAspectRatio: false,
plugins: { legend: { display: false } },
scales: {
x: { grid: { display: false } },
y: { grid: { color: '#f0f0f0' }, ticks: { precision: 0 } }
}
}

Card wrapper: white bg, rounded-2xl, shadow-sm, p-4, machine name as font-semibold.

4c — StatsView final assembly

Add after heatmap in scrollable area:

<WeightChart
   v-for="machine in machinesStore.machines"
   :key="machine.id"
   :machine-id="machine.id"
   :machine-name="machine.name"
   :accent="palette.accent"
 />

---

Verification

source ~/.nvm/nvm.sh && ./node_modules/.bin/vue-tsc --noEmit

Manual checks:

1.  Navigate to /stats — flipped waves appear at top, "Statistics" header, back button all visible
2.  Quick stats: seed data (no sessions) → streak=0, sessions=0, weight=180kg
3.  Heatmap: 52 cells, current week has a ring, all grey initially
4.  Log a machine in Main → go to Stats → that week's cell turns coloured, sessions count increments
5.  After 2+ sessions on a machine → weight chart shows a line with accent color; before that, "Not enough data yet"
6.  Back button returns to Main with slide-down transition
