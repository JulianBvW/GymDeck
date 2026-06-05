Phase 5 — FitnessView

Context

Phase 5 builds the fitness logging screen. Users can log body-performance checks (push-ups, stretching reach) using an iOS-style drum-roll picker, see a chart of their history, and confirm the entry. The entire data layer (useFitnessStore) and routing are already in place — this
phase is purely UI.

---

Part 1 — FitnessView layout shell

File: src/views/FitnessView.vue (replace "Coming soon" stub)

Mirror the StatsView shell pattern:

- WaveBackground with :flip="false" (waves from bottom, same as MainView) and :progress="0.15"
- Palette from useDailyPalette() (call at top of <script setup>)
- In-flow header: "FITNESS" label (small caps) + "Your body" h2, back button with ChevronDown
- goBack(): uiStore.transitionDirection = 'up' → router.push('/')
- Scrollable content area below header (overflow-y-auto, overscroll-behavior-y: contain, pb-8 px-5)
- Placeholder <div> where FitnessCards will go

---

Part 2 — DrumRollPicker component

File: src/components/DrumRollPicker.vue (new)

Props: modelValue: number, min: number, max: number, step: number, accent: string
Emits: update:modelValue

Implementation:

- Build a values array from min/max/step in a computed
- Scrollable container: fixed height (5 items × item height), overflow-y: scroll, scroll-snap-type: y mandatory, hide scrollbar
- Each item: fixed item-height (e.g. 36px), scroll-snap-align: center, centred text
- Padding sentinel divs top and bottom (2 × item-height each) so first and last values can snap to centre
- Centre highlight: absolutely positioned band (1 × item-height) with light background, pointer-events-none
- Selected item text uses accent color + font-bold; others use text-gray-400
- Sync scroll → value: onscroll listener (passive) reads scrollTop, computes nearest index, emits if changed
- Sync value → scroll: watch(modelValue) calls scrollTo({ top, behavior: 'smooth' }) on the container ref — but only when the change comes from outside (guard with a flag to avoid loop)
- onMounted: scroll to initial modelValue position instantly (behavior: 'instant')
- Touch listeners: register touchstart/touchmove with { passive: false } so vertical scroll inside the picker doesn't bubble to the page scroll; remove in onUnmounted

---

Part 3 — FitnessCard + FitnessView assembly

File: src/components/FitnessCard.vue (new)

Props: checkId: string
Reads useFitnessStore() and useDailyPalette() directly.

Layout (white card, rounded-2xl shadow-sm p-4):

- Top row: check name (left) + confirm button Check icon (right, accent colour)
- Bottom row: chart 80% width | picker 20% width, separated by a thin vertical divider

Chart (vue-chartjs <Line>):

- points computed: filter fitnessStore.measurements by checkId, sort by date, take last 20, format x as DD.MM. (reuse src/utils/date.ts string-slice pattern from WeightChart.vue)
- Live "today" point: append { x: 'Today', y: pickerValue } to the dataset — always present, grey (#d1d5db), distinct pointBackgroundColor per-point using a scriptable function
- Historical points: accent colour; today point: grey
- Line colour: accent; gradient fill same pattern as WeightChart.vue (Filler already registered in main.ts)
- chartOptions: no legend, maxTicksLimit: 4, maintainAspectRatio: false, height h-28
- < 1 historical point: show "No data yet" placeholder instead of chart

Picker:

- <DrumRollPicker v-model="pickerValue" :min :max :step :accent />
- pickerValue initialised to today's existing measurement value if one exists, else the check's defaultValue (midpoint of range or last recorded value)
- fitnessStore does not store min/max per check — these need to be defined: Push Ups 0–200 step 1, Stretching Reach 0–100 step 0.5. Store these as constants in the card or derived from check metadata.

Confirm button:

- Calls fitnessStore.logMeasurement(checkId, today, pickerValue) — today from sessionsStore.today (already a computed in the store)
- Brief visual feedback: button flashes to filled accent for 600ms then returns to outline

FitnessView assembly:

- v-for="check in fitnessStore.checks" :key="check.id" renders <FitnessCard>
- flex flex-col gap-4 list

---

Verification

1.  vue-tsc --noEmit — zero errors
2.  FitnessView opens from MainView with slide-down transition, back button returns with slide-up
3.  DrumRollPicker snaps cleanly to each value, emits on scroll
4.  FitnessCard shows "No data yet" with no measurements, chart appears after first log
5.  Live today point moves on the chart as picker scrolls
6.  Confirm button saves; re-opening the view shows the saved value pre-selected in the picker
