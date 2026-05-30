Phase 3 — CardStack & WaveBackground

Context

Phase 2 delivered a single, fully interactive MachineCard. Phase 3 assembles the real main page: a stack of cards, animated waves that rise as machines are completed, a top bar, navigation, and page transitions. After this phase the app is a complete gym session experience.

New files: CardStack.vue, WaveBackground.vue
Updated files: MainView.vue, App.vue, router/index.ts, MachineCard.vue

Milestone: Full working gym session on main page. Cards swipe, waves rise, session records to store.

---

Part 1 — CardStack: static visual stack

Commit: Phase 3 part 1 — CardStack static layout

src/components/CardStack.vue

Props: machines: Machine[], accent: string

Machine order on mount (onMounted): build remainingMachines: Ref<Machine[]>:

- Start with all machines from props
- Filter out any already in todaySession.machinesDone
- If no session today → Fisher-Yates shuffle the full list
- If session in progress → use machines not yet done, preserving existing order

Rendering: v-for over the first 3 of remainingMachines. Each card sits in a wrapper div with a computed transform:

- Index 0 (top): scale(1) translateY(0) — full size, z-index: 2
- Index 1: scale(0.95) translateY(10px) — z-index: 1, pointer-events: none
- Index 2: scale(0.90) translateY(20px) — z-index: 0, pointer-events: none

Use :style with inline transforms. Wrapper is position: absolute so cards overlap.

No emits yet — static visual only.

src/views/MainView.vue

Replace bare <MachineCard> with:
<CardStack :machines="machinesStore.machines" :accent="palette.accent" />
Remove the four event handlers (they move to CardStack in Part 2).

---

Part 2 — CardStack: interactions + session complete

Commit: Phase 3 part 2 — CardStack interactions and session logic

src/components/MachineCard.vue — add drag tracking emits

Add two new emits: swipe-start: [] and swipe-end: []. Fire swipe-start in onTouchStart (after guard), swipe-end at the end of both triggerSwipeOut and snapBack (and the pure-tap branch in onTouchEnd).

CardStack.vue — wire events

Handle top card's @done, @weight-up, @later, @skip:

- done → sessionsStore.logEntry({ machineId, weight: machine.currentWeight, weightIncreased: false }) → removeTopCard()
- weightUp → snapshot weight first → sessionsStore.logEntry(..., weightIncreased: true) → machinesStore.updateMachine(id, { currentWeight: weight + stepSize }) → removeTopCard()
- later → push remainingMachines[0] to end of array → removeTopCard()
- skip → removeTopCard() (no log, no requeue)

removeTopCard(): remainingMachines.value.shift()

Promote-next animation

After removeTopCard(), the new top card needs to spring from peeking position to full size. Use isPromoting = ref(false):

1.  Set isPromoting = true on removal
2.  The new top card's wrapper reads isPromoting — when true, add transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1) to its style
3.  setTimeout(() => { isPromoting.value = false }, 350)

The transform itself changes reactively: the card that was at index 1 (scale 0.95, translateY 10px) is now at index 0 (scale 1, translateY 0). The CSS transition makes it spring into place.

Session complete screen

When remainingMachines.length === 0, show instead of cards:
All done! 🎉
[X] machines · [Y] weight increases
Compute from todaySession.value?.machinesDone.

isSwiping — expose for bottom touch zone

Track isSwiping = ref(false) in CardStack, toggled by top card's @swipe-start / @swipe-end.
Expose via defineExpose({ isSwiping }).

In MainView.vue: const cardStackRef = ref(), pass ref="cardStackRef" to <CardStack>, then const isSwiping = computed(() => cardStackRef.value?.isSwiping ?? false).

---

Part 3 — WaveBackground

Commit: Phase 3 part 3 — WaveBackground animated waves

src/components/WaveBackground.vue

Props: progress: number (0–1), wave1: string, wave2: string, wave3: string

Structure: position: absolute; inset: 0; pointer-events: none; overflow: hidden. Three wave layers stacked (wave1 behind, wave3 in front).

Height via CSS variable: Bind --wave-top: calc(${100 - (10 + progress \* 80)}%) on the root element. Each wave layer is position: absolute; top: var(--wave-top); left: -50px; right: -50px; bottom: 0. Root element has transition: --wave-top 600ms ease — but CSS variables aren't
transitionable directly. Instead, compute a pixel value and transition the top property: bind :style="{ '--wave-top': waveTopPct }" and add transition: top 600ms ease on the child layers.

Simpler approach that works: each wave layer has position: absolute; bottom: 0; left: -50px; right: -50px; height: var(--wave-height); transition: height 600ms ease. Bind --wave-height: calc(${10 + progress \* 85}vh) on the root. Child layers read the variable.

SVG wave per layer: Each layer contains an <svg viewBox="0 0 1440 200" preserveAspectRatio="none" width="100%" height="100%"> with a <path> that draws the wave top then fills to the bottom:
M0,100 C240,20 480,180 720,100 S1200,20 1440,100 L1440,200 L0,200 Z
Each wave has slightly different control point offsets for visual variety.

Horizontal animation: The SVG itself (not the path) gets animation: waveScroll Xs linear infinite. @keyframes waveScroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }. To make this seamless, the SVG path is doubled (two periods wide, 2880px viewBox) so
the loop is invisible. Speeds: wave1=18s, wave2=12s, wave3=8s.

Colors: wave1/wave2/wave3 props at 85% opacity each.

Integration: Add <WaveBackground> to MainView (position absolute, z-index 0). CardStack sits above (z-index 1).

---

Part 4 — MainView full layout + App.vue transitions

Commit: Phase 3 part 4 — MainView layout and page transitions

MainView.vue — full layout

Replace centered-card layout with full screen:

position: relative, h-full, overflow: hidden
WaveBackground (absolute, inset 0, z-0)
top bar (absolute, top 0, full width, z-20)
left: "X / Y" progress counter (small, muted text)
right: Activity icon button → Fitness, Settings icon button → Settings
CardStack (relative, z-10, centered in remaining space)
bottom touch zone (absolute, bottom 0, full width, h-[25%], z-10)

Progress counter: computed(() => todaySession.value?.machinesDone.length ?? 0) / machinesStore.machines.length.

Navigation:
function goToFitness() {
uiStore.transitionDirection = 'down'
router.push('/fitness')
}
function goToSettings() {
uiStore.transitionDirection = 'right'
router.push('/settings')
}

Bottom touch zone: @touchend only; guard if (isSwiping.value) return:
function onBottomZoneTap() {
if (isSwiping.value) return
uiStore.transitionDirection = 'up'
router.push('/stats')
}

App.vue — transition wrapper

 <script setup lang="ts">
 import { useUIStore } from '@/stores/ui'
 const uiStore = useUIStore()
 </script>
 <template>
   <Transition :name="`slide-${uiStore.transitionDirection}`">
     <RouterView :key="$route.path" />
   </Transition>
 </template>

CSS in main.css (not scoped — must be global for <Transition> to apply):
.slide-up-enter-from { transform: translateY(100%) }
.slide-up-leave-to { transform: translateY(-100%) }
.slide-down-enter-from { transform: translateY(-100%) }
.slide-down-leave-to { transform: translateY(100%) }
.slide-right-enter-from { transform: translateX(100%) }
.slide-right-leave-to { transform: translateX(-100%) }
.slide-left-enter-from { transform: translateX(-100%) }
.slide-left-leave-to { transform: translateX(100%) }

.slide-up-enter-active, .slide-up-leave-active,
.slide-down-enter-active, .slide-down-leave-active,
.slide-right-enter-active, .slide-right-leave-active,
.slide-left-enter-active, .slide-left-leave-active {
transition: transform 350ms cubic-bezier(0.4, 0, 0.2, 1);
position: absolute;
width: 100%;
height: 100%;
}

position: absolute on transitioning views is required so both views overlap during the transition.

Back navigation on stub views

StatsView.vue: add a back button that sets uiStore.transitionDirection = 'down' then router.push('/').
FitnessView.vue: add a back button that sets uiStore.transitionDirection = 'up' then router.push('/').

---

Files created / modified

┌───────────────────────────────────┬─────────────────────────────────┐
│ File │ Action │
├───────────────────────────────────┼─────────────────────────────────┤
│ src/components/CardStack.vue │ Create │
├───────────────────────────────────┼─────────────────────────────────┤
│ src/components/WaveBackground.vue │ Create │
├───────────────────────────────────┼─────────────────────────────────┤
│ src/components/MachineCard.vue │ Add swipe-start/swipe-end emits │
├───────────────────────────────────┼─────────────────────────────────┤
│ src/views/MainView.vue │ Full rewrite │
├───────────────────────────────────┼─────────────────────────────────┤
│ src/views/StatsView.vue │ Add back-nav │
├───────────────────────────────────┼─────────────────────────────────┤
│ src/views/FitnessView.vue │ Add back-nav │
├───────────────────────────────────┼─────────────────────────────────┤
│ src/App.vue │ Add Transition wrapper │
├───────────────────────────────────┼─────────────────────────────────┤
│ src/router/index.ts │ Add named routes (optional) │
├───────────────────────────────────┼─────────────────────────────────┤
│ src/assets/main.css │ Add transition CSS classes │
└───────────────────────────────────┴─────────────────────────────────┘

Verification

- Card stack shows 3 cards with 2 peeking below the active one
- Swipe/tap Done → card flies off, next card springs up to full size
- Swipe all 4 machines → Session Complete screen with stats
- Progress counter increments with each done/weightUp action
- Waves rise from sliver → nearly full screen as progress goes 0→4
- Tap bottom 25% → Stats slides up; tapping during a swipe does nothing
- Fitness button → Fitness slides down from top; back button reverses
- Settings button → Settings slides in from right; back button reverses

Tag after Part 4 commit: git tag phase-3-done
